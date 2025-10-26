export default async function handler(req, res) {
  try {
    const { ip } = req.query || {};
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: ip' });
    }
    const key = process.env.ABUSEIPDB_API_KEY || process.env.VITE_ABUSEIPDB_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Server misconfigured: ABUSEIPDB_API_KEY not set' });
    }
    const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
    const upstream = await fetch(url, {
      headers: {
        Accept: 'application/json',
        Key: key,
      },
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (err) {
    console.error('AbuseIPDB proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
