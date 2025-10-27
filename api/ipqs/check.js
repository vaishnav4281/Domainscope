// OPTIMIZED: Multi-key rotation with instant failover
// Persistent key index across requests (survives in serverless warm instances)
let currentKeyIndex = 0;

export default async function handler(req, res) {
  try {
    const { ip } = req.query || {};
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: ip' });
    }
    
    // Collect all available IPQS keys
    const keys = [
      process.env.IPQS_API_KEY || process.env.VITE_IPQS_API_KEY,
      process.env.IPQS_API_KEY_2 || process.env.VITE_IPQS_API_KEY_2,
      process.env.IPQS_API_KEY_3 || process.env.VITE_IPQS_API_KEY_3,
      process.env.IPQS_API_KEY_4 || process.env.VITE_IPQS_API_KEY_4,
      process.env.IPQS_API_KEY_5 || process.env.VITE_IPQS_API_KEY_5,
    ].filter(Boolean);
    
    if (keys.length === 0) {
      return res.status(500).json({ error: 'Server misconfigured: No IPQS_API_KEY set' });
    }
    
    // Try keys sequentially starting from last working one
    let lastError = null;
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const keyIndex = (currentKeyIndex + attempt) % keys.length;
      const key = keys[keyIndex];
      
      try {
        const url = `https://ipqualityscore.com/api/json/ip/${encodeURIComponent(key)}/${encodeURIComponent(ip)}?strictness=1&allow_public_access_points=true&lighter_penalties=true`;
        const upstream = await fetch(url, { headers: { accept: 'application/json' } });
        const text = await upstream.text();
        
        // Check if quota exceeded
        if (text.includes('exceeded your request quota')) {
          console.warn(`IPQS: Key #${keyIndex + 1} quota exceeded, trying next...`);
          lastError = new Error(`Key #${keyIndex + 1} quota exceeded`);
          continue; // Try next key immediately
        }
        
        // Success! Update current key index for next request
        if (keyIndex !== currentKeyIndex) {
          console.log(`IPQS: ⚡ Switched to key #${keyIndex + 1}`);
          currentKeyIndex = keyIndex;
        }
        
        res.status(upstream.status);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        return res.send(text);
      } catch (err) {
        console.error(`IPQS: Key #${keyIndex + 1} error:`, err.message);
        lastError = err;
        continue;
      }
    }
    
    // All keys failed
    console.warn('IPQS: All keys exhausted or failed');
    return res.status(402).json({ 
      success: false, 
      message: 'All IPQS API keys have exceeded their quota. Please try again later.' 
    });
  } catch (err) {
    console.error('IPQS proxy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
