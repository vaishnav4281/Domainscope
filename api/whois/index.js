export default async function handler(req, res) {
  try {
    const { domain } = req.query || {};
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: domain' });
    }

    // Upstream WHOIS backend
    const base = process.env.WHOIS_API_BASE || 'https://whois-aoi.onrender.com';
    const url = `${base.replace(/\/$/, '')}/whois/?domain=${encodeURIComponent(domain)}`;

    const upstream = await fetch(url, { headers: { accept: 'application/json' } });
    const text = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (err) {
    console.error('WHOIS proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
