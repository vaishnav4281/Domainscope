export default async function handler(req, res) {
  try {
    const { ip } = req.query || {};
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: ip' });
    }
    const key = process.env.IPQS_API_KEY || process.env.VITE_IPQS_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'Server misconfigured: IPQS_API_KEY not set' });
    }
    const url = `https://ipqualityscore.com/api/json/ip/${encodeURIComponent(key)}/${encodeURIComponent(ip)}?strictness=1&allow_public_access_points=true&lighter_penalties=true`;
    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (err) {
    console.error('IPQS proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
