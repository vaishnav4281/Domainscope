import express from 'express';
import dns from 'dns/promises';
import cors from 'cors';

const app = express();
app.use(cors());

const ZONES = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'dnsbl.sorbs.net',
  'b.barracudacentral.org',
];

function reverseIp(ip) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').reverse().join('.');
  }
  return null;
}

async function checkZone(ip, zone) {
  const rev = reverseIp(ip);
  if (!rev) return { zone, listed: false, text: null };
  const fqdn = `${rev}.${zone}`;
  try {
    await dns.resolve4(fqdn);
    let txt = [];
    try {
      const records = await dns.resolveTxt(fqdn);
      txt = records.flat();
    } catch {}
    return { zone, listed: true, text: txt.join(' ') || null };
  } catch {
    return { zone, listed: false, text: null };
  }
}

app.get('/api/dnsbl/check', async (req, res) => {
  try {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Missing IP parameter' });
    }
    console.log('🔍 DNSBL check for:', ip);
    const results = await Promise.all(ZONES.map(z => checkZone(ip, z)));
    const listed = results.filter(r => r && r.listed);
    console.log('✅ DNSBL results:', listed.length, 'blacklists');
    res.json({ ip, results, listedCount: listed.length });
  } catch (err) {
    console.error('❌ DNSBL error:', err);
    res.status(500).json({ error: 'DNSBL check failed' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 DNSBL server running on http://localhost:${PORT}`);
});
