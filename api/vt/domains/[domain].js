export default async function handler(req, res) {
  try {
    const { domain } = req.query || {};
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: domain' });
    }

    const apiKey = process.env.VIRUSTOTAL_API_KEY || process.env.VITE_VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server misconfigured: VIRUSTOTAL_API_KEY not set' });
    }

    const url = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`;

    const upstream = await fetch(url, {
      headers: {
        'x-apikey': apiKey,
        'accept': 'application/json',
      },
    });

    const text = await upstream.text();

    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    // Optional: allow same-origin usage; loosen if you need cross-origin testing
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (err) {
    console.error('VT proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
