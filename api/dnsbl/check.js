import dns from 'dns';

const resolver = new dns.Resolver();
resolver.setServers(['1.1.1.1', '8.8.8.8']);

const ZONES = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'dnsbl.sorbs.net',
  'b.barracudacentral.org',
  'spam.dnsbl.sorbs.net',
  'dul.dnsbl.sorbs.net',
  'http.dnsbl.sorbs.net',
];

function reverseIp(ip) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').reverse().join('.');
  }
  // IPv6 not supported for most DNSBLs; skip
  return null;
}

async function checkZone(ip, zone) {
  const rev = reverseIp(ip);
  if (!rev) return null;
  const fqdn = `${rev}.${zone}`;
  try {
    // A record: listed; TXT provides details
    await resolver.resolve4(fqdn);
    let txt = [];
    try {
      txt = await resolver.resolveTxt(fqdn);
    } catch {}
    return { zone, listed: true, text: txt.flat().join(' ') || null };
  } catch {
    return { zone, listed: false, text: null };
  }
}

export default async function handler(req, res) {
  try {
    const { ip } = req.query || {};
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: ip' });
    }
    const results = await Promise.all(ZONES.map(z => checkZone(ip, z)));
    const listed = results.filter(r => r && r.listed);
    res.status(200).json({ ip, results, listedCount: listed.length });
  } catch (err) {
    console.error('DNSBL check error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
