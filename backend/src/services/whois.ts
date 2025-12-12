import { promises as dns } from 'dns';
import whois from 'whois-json';

import { redis } from '../redis.js';
import { waitForWhoisSlot, recordWhoisQuery, getWhoisRateLimitStatus } from './whois-queue.js';

// Simple in-memory cache (will be replaced by Redis later)
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

const TLD_WHOIS_SERVERS: Record<string, string> = {
    'com': 'whois.verisign-grs.com',
    'net': 'whois.verisign-grs.com',
    'org': 'whois.publicinterestregistry.net',
    'io': 'whois.nic.io',
    // ... add others as needed or import from a config
};

const FALLBACK_WHOIS_SERVERS = [
    'whois.iana.org',
    'whois.icann.org',
    'whois.internic.net'
];

function normalizeDate(dateStr: string | undefined | null): string {
    if (!dateStr) return '';
    try {
        // Handle "DD-Mon-YYYY" format often returned by some WHOIS servers
        // and other non-standard formats by letting Date.parse try first
        const date = new Date(dateStr);

        // Check if valid
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }

        // If direct parsing failed, try some manual cleanups
        // Example: "2023-01-01 12:00:00 UTC" -> "2023-01-01T12:00:00Z"
        const cleaned = dateStr.replace(' ', 'T').replace(' UTC', 'Z');
        const date2 = new Date(cleaned);
        if (!isNaN(date2.getTime())) {
            return date2.toISOString();
        }

        return dateStr; // Return original if all else fails
    } catch (e) {
        return dateStr || '';
    }
}

async function queryWhoisServer(domain: string, server: string | null = null) {
    try {
        // Wait for a WHOIS query slot to become available (max 5 seconds)
        const canQuery = await waitForWhoisSlot(5000);
        if (!canQuery) {
            console.warn(`⏱️ WHOIS rate limit queue full for ${domain}. Skipping query to ${server || 'default'}.`);
            return null;
        }

        const options = server ? { server } : {};
        const result = await whois(domain, { ...options, timeout: 10000 });

        // Record this query for rate limiting
        await recordWhoisQuery();

        if (result && (result.registrar || result.creationDate || result.registrant)) {
            return {
                domain_name: domain,
                registrar: result.registrar || 'Unknown',
                creation_date: normalizeDate(result.creationDate || result.registered),
                expiration_date: normalizeDate(result.expirationDate || result.registryExpiryDate),
                updated_date: normalizeDate(result.updatedDate || result.changed),
                name_servers: result.nameServer ?
                    (Array.isArray(result.nameServer) ? result.nameServer : [result.nameServer]) : [],
                status: result.domainStatus || '',
                raw: JSON.stringify(result, null, 2),
                source: server || 'default'
            };
        }

        console.log(`⚠️ WHOIS validation failed for ${domain} on ${server || 'default'}. Raw result keys:`, Object.keys(result || {}));
        if (Object.keys(result || {}).length > 0) {
            console.log('Raw result sample:', JSON.stringify(result, null, 2).slice(0, 500));
        }
        return null;
    } catch (error: any) {
        console.error(`❌ WHOIS query failed for ${domain} on ${server || 'default'}:`, error.message);
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            console.warn(`   -> Network error: ${error.code}`);
        }
        return null;
    }
}

async function resolveBestWhoisServer(domain: string) {
    try {
        const tld = domain.split('.').pop()?.toLowerCase() || '';
        const potentialServers = new Set<string>();

        if (TLD_WHOIS_SERVERS[tld]) {
            potentialServers.add(TLD_WHOIS_SERVERS[tld]);
        }

        potentialServers.add(`whois.nic.${tld}`);
        potentialServers.add(`whois.${tld}`);

        FALLBACK_WHOIS_SERVERS.forEach(server => potentialServers.add(server));

        const serverChecks = Array.from(potentialServers).map(async (server) => {
            try {
                await dns.lookup(server);
                return server;
            } catch (e) {
                return null;
            }
        });

        const results = await Promise.all(serverChecks);
        return results.find(server => server !== null) || null;

    } catch (error: any) {
        console.warn('Error finding best WHOIS server:', error.message);
        return null;
    }
}

async function queryRdap(domain: string) {
    try {
        console.log(`[RDAP] Querying RDAP for ${domain}...`);
        const response = await fetch(`https://rdap.org/domain/${domain}`, {
            headers: { 'Accept': 'application/rdap+json' }
        });

        if (!response.ok) {
            console.warn(`[RDAP] Request failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const data: any = await response.json();

        // Extract dates from RDAP events
        const events = data.events || [];
        const creationDate = events.find((e: any) => e.eventAction === 'registration')?.eventDate;
        const expirationDate = events.find((e: any) => e.eventAction === 'expiration')?.eventDate;
        const updatedDate = events.find((e: any) => e.eventAction === 'last changed')?.eventDate;

        // Extract registrar
        let registrar = 'Unknown';
        if (data.entities) {
            const registrarEntity = data.entities.find((e: any) => e.roles?.includes('registrar'));
            if (registrarEntity && registrarEntity.vcardArray) {
                // vcardArray is complex: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Name"]]]
                const fnEntry = registrarEntity.vcardArray[1]?.find((item: any) => item[0] === 'fn');
                if (fnEntry) registrar = fnEntry[3];
            }
        }

        if (creationDate || expirationDate || registrar !== 'Unknown') {
            return {
                domain_name: domain,
                registrar: registrar,
                creation_date: normalizeDate(creationDate),
                expiration_date: normalizeDate(expirationDate),
                updated_date: normalizeDate(updatedDate),
                name_servers: data.nameservers ? data.nameservers.map((ns: any) => ns.ldhName) : [],
                status: data.status ? data.status.join(', ') : '',
                raw: JSON.stringify(data, null, 2),
                source: 'RDAP (rdap.org)'
            };
        }
        return null;

    } catch (error: any) {
        console.error(`[RDAP] Error for ${domain}:`, error.message);
        return null;
    }
}

export async function getWhois(domain: string, force = false) {
    const cacheKey = `whois:${domain.toLowerCase()}`;

    if (!force) {
        const cached = await redis.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            return {
                ...parsed.data,
                cached: true,
                source: `cached (${parsed.source})`
            };
        }
    }

    const bestServer = await resolveBestWhoisServer(domain);
    let result = await queryWhoisServer(domain, bestServer);

    // If best server failed, try IANA
    if (!result) {
        console.log(`[WHOIS] Retrying ${domain} with IANA...`);
        result = await queryWhoisServer(domain, 'whois.iana.org');
    }

    // If still failed, try Verisign for com/net
    if (!result && (domain.endsWith('.com') || domain.endsWith('.net'))) {
        console.log(`[WHOIS] Retrying ${domain} with Verisign...`);
        result = await queryWhoisServer(domain, 'whois.verisign-grs.com');
    }

    // If Verisign failed, try Godaddy (often works for stubborn .coms)
    if (!result && domain.endsWith('.com')) {
        console.log(`[WHOIS] Retrying ${domain} with Godaddy...`);
        result = await queryWhoisServer(domain, 'whois.godaddy.com');
    }

    // Final attempt with default (no server specified)
    if (!result) {
        console.log(`[WHOIS] Final retry for ${domain} with default server...`);
        result = await queryWhoisServer(domain);
    }

    // If WHOIS completely failed (likely rate limited or blocked), try RDAP
    if (!result) {
        console.log(`[WHOIS] All WHOIS methods failed. Attempting RDAP fallback for ${domain}...`);
        result = await queryRdap(domain);
    }

    if (result) {
        await redis.set(cacheKey, JSON.stringify({
            data: result,
            source: result.source,
            timestamp: Date.now()
        }), 'EX', CACHE_TTL);
    }

    return result;
}
