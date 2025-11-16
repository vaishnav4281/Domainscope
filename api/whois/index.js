import { promises as dns } from 'dns';
import whois from 'whois-json';

// Simple in-memory cache (consider using Redis or similar in production)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Map of TLDs to their specific WHOIS servers
const TLD_WHOIS_SERVERS = {
  // Generic TLDs
  'com': 'whois.verisign-grs.com',
  'net': 'whois.verisign-grs.com',
  'org': 'whois.publicinterestregistry.net',
  'io': 'whois.nic.io',
  'app': 'whois.nic.google',
  'dev': 'whois.nic.google',
  'xyz': 'whois.nic.xyz',
  'top': 'whois.nic.top',
  'online': 'whois.nic.online',
  'site': 'whois.nic.site',
  'store': 'whois.nic.store',
  'tech': 'whois.nic.tech',
  'shop': 'whois.nic.shop',
  'blog': 'whois.nic.google',
  'eu': 'whois.eu',
  'uk': 'whois.nic.uk',
  'de': 'whois.denic.de',
  'fr': 'whois.nic.fr',
  'nl': 'whois.domain-registry.nl',
  'ru': 'whois.tcinet.ru',
  'cn': 'whois.cnnic.cn',
  'jp': 'whois.jprs.jp',
  'in': 'whois.registry.in',
  'br': 'whois.registro.br',
  'au': 'whois.auda.org.au',
  'ca': 'whois.cira.ca',
  'info': 'whois.afilias-srs.net',
  'biz': 'whois.nic.biz',
  'mobi': 'whois.afilias.net',
  'name': 'whois.nic.name'
};

// Fallback WHOIS servers (tried in order if TLD-specific server fails)
const FALLBACK_WHOIS_SERVERS = [
  'whois.iana.org',
  'whois.icann.org',
  'whois.internic.net'
];

async function queryWhoisServer(domain, server = null) {
  try {
    const options = server ? { server } : {};
    const result = await whois(domain, { ...options, timeout: 5000 });
    
    // Validate we got useful data
    if (result && (result.registrar || result.creationDate || result.registrant)) {
      return {
        domain_name: domain,
        registrar: result.registrar || 'Unknown',
        creation_date: result.creationDate || result.registered || '',
        expiration_date: result.expirationDate || result.registryExpiryDate || '',
        updated_date: result.updatedDate || result.changed || '',
        name_servers: result.nameServer ? 
          (Array.isArray(result.nameServer) ? result.nameServer : [result.nameServer]) : [],
        status: result.domainStatus || '',
        raw: JSON.stringify(result, null, 2),
        source: server || 'default'
      };
    }
    return null;
  } catch (error) {
    console.warn(`WHOIS query failed for ${domain} on ${server || 'default'}:`, error.message);
    return null;
  }
}

async function resolveBestWhoisServer(domain) {
  try {
    const tld = domain.split('.').pop().toLowerCase();
    const potentialServers = new Set();

    // 1. Try TLD-specific server from our map
    if (TLD_WHOIS_SERVERS[tld]) {
      potentialServers.add(TLD_WHOIS_SERVERS[tld]);
    }

    // 2. Common patterns for this TLD
    potentialServers.add(`whois.nic.${tld}`);
    potentialServers.add(`whois.${tld}`);
    potentialServers.add(`whois.${tld}.com`);
    potentialServers.add(`whois.${tld}.net`);
    
    // 3. For country-code TLDs, try regional NICs
    if (tld.length === 2) {
      potentialServers.add(`whois.nic.${tld}`);
      potentialServers.add(`whois.${tld}.whois-servers.net`);
      potentialServers.add(`whois.iana.org`);
    }

    // 4. Add fallback servers
    FALLBACK_WHOIS_SERVERS.forEach(server => potentialServers.add(server));

    // Try each server in parallel with a short timeout
    const serverChecks = Array.from(potentialServers).map(async (server) => {
      try {
        await dns.lookup(server);
        return server;
      } catch (e) {
        return null;
      }
    });

    // Wait for the first successful resolution
    const results = await Promise.all(serverChecks);
    return results.find(server => server !== null) || null;
    
  } catch (error) {
    console.warn('Error finding best WHOIS server:', error.message);
    return null;
  }
}

// Function to extract and clean domain from any input
function extractDomain(input) {
  if (!input || typeof input !== 'string') return null;
  
  try {
    // Remove everything that's not part of the domain
    let domain = input
      .trim()
      // Remove protocol
      .replace(/^https?:\/\//i, '')
      // Remove www. prefix
      .replace(/^www\./i, '')
      // Remove everything after first /, ?, #, or space
      .split(/[\s\/?#]/)[0]
      // Remove port if present
      .split(':')[0]
      // Remove any trailing dots
      .replace(/\.+$/, '');
    
    // Final validation - must be a valid domain
    const domainRegex = /^([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      console.warn(`Invalid domain format: ${input} -> ${domain}`);
      return null;
    }
    
    return domain.toLowerCase();
  } catch (error) {
    console.error('Error extracting domain:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    let { domain, force = false } = req.query || {};
    
    // Extract and clean the domain
    const cleanedDomain = extractDomain(domain);
    if (!cleanedDomain) {
      return res.status(400).json({ 
        error: 'Invalid domain format',
        original: domain,
        example: 'example.com' 
      });
    }
    
    // Use cleaned domain for all further processing
    domain = cleanedDomain;
    
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: domain' });
    }

    // Basic domain validation
    if (!/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' });
    }

    // Check cache first
    const cacheKey = `whois:${domain.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    
    if (cached && !force && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`Cache hit for ${domain}`);
      return res.status(200).json({
        ...cached.data,
        cached: true,
        source: `cached (${cached.source})`
      });
    }

    console.log(`Cache miss for ${domain}, querying WHOIS...`);
    
    // Find the best WHOIS server for this domain
    const bestServer = await resolveBestWhoisServer(domain);
    console.log(`Using WHOIS server: ${bestServer || 'default'}`);
    
    // Try with the best server first, then fall back to default
    let result = await queryWhoisServer(domain, bestServer);
    if (!result) {
      result = await queryWhoisServer(domain);
    }

    if (!result) {
      return res.status(404).json({ 
        error: 'Could not retrieve WHOIS information',
        domain,
        tried: bestServer ? [bestServer, 'default'] : ['default']
      });
    }

    // Cache the successful result
    cache.set(cacheKey, {
      data: result,
      source: result.source,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }

    return res.status(200).json({
      ...result,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('WHOIS lookup error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
