import { redis } from '../redis.js';

/**
 * URLScan.io API Integration
 * Free tier: ~1,000 requests/day = 30,000/month
 * API Key rotation for extended limits
 */

const URLSCAN_KEYS = [
    process.env.URLSCAN_API_KEY,
    process.env.URLSCAN_API_KEY_2,
    process.env.URLSCAN_API_KEY_3
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextKey = () => {
    if (URLSCAN_KEYS.length === 0) return null;
    const key = URLSCAN_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % URLSCAN_KEYS.length;
    return key;
};

export async function checkURLScan(url: string) {
    const cacheKey = `urlscan:${url}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[URLScan] Returning cached result for ${url}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[URLScan] Cache error:', err);
    }

    if (URLSCAN_KEYS.length === 0) {
        console.warn('No URLSCAN_API_KEY set');
        return {
            error: 'API key not configured',
            available: false
        };
    }

    // Try each API key
    for (let i = 0; i < URLSCAN_KEYS.length; i++) {
        const apiKey = getNextKey();
        if (!apiKey) continue;

        try {
            // Submit URL for scanning
            const submitResponse = await fetch('https://urlscan.io/api/v1/scan/', {
                method: 'POST',
                headers: {
                    'API-Key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url,
                    visibility: 'public',
                    tags: ['domainscope']
                })
            });

            if (submitResponse.status === 429) {
                console.warn(`[URLScan] Key ${i + 1} rate limited, trying next...`);
                continue;
            }

            if (!submitResponse.ok) {
                const errorText = await submitResponse.text();
                console.warn(`[URLScan] Submit Error: ${submitResponse.status} - ${errorText}`);
                if (submitResponse.status === 401 || submitResponse.status === 403) continue;
                return { error: `API Error: ${submitResponse.status}` };
            }

            const submitData = await submitResponse.json();
            const scanId = submitData.uuid;
            const resultUrl = submitData.result;

            // Wait a bit for scan to complete (URLScan.io takes 10-30 seconds)
            await new Promise(resolve => setTimeout(resolve, 15000));

            // Fetch results
            const resultResponse = await fetch(resultUrl, {
                headers: {
                    'API-Key': apiKey
                }
            });

            if (!resultResponse.ok) {
                // Scan might still be processing
                return {
                    url,
                    scanId,
                    status: 'processing',
                    resultUrl,
                    message: 'Scan initiated - results will be available shortly',
                    timestamp: new Date().toISOString()
                };
            }

            const resultData = await resultResponse.json();

            const analysis = {
                url,
                scanId,
                resultUrl,
                status: 'completed',
                page: {
                    domain: resultData.page?.domain,
                    ip: resultData.page?.ip,
                    country: resultData.page?.country,
                    server: resultData.page?.server,
                    asn: resultData.page?.asn,
                    asnname: resultData.page?.asnname
                },
                verdicts: resultData.verdicts || {},
                stats: resultData.stats || {},
                screenshot: resultData.task?.screenshotURL || null,
                malicious: resultData.verdicts?.overall?.malicious || false,
                score: resultData.verdicts?.overall?.score || 0,
                timestamp: new Date().toISOString()
            };

            // Cache for 24 hours
            await redis.setex(cacheKey, 86400, JSON.stringify(analysis));
            return analysis;

        } catch (error: any) {
            console.error(`[URLScan] Error with key ${i + 1}:`, error.message);
        }
    }

    return { error: 'All API keys exhausted or failed' };
}

/**
 * Search URLScan.io for existing scans (no quota usage)
 */
export async function searchURLScan(domain: string) {
    const cacheKey = `urlscan_search:${domain}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[URLScan-Search] Cache error:', err);
    }

    try {
        const response = await fetch(
            `https://urlscan.io/api/v1/search/?q=domain:${domain}&size=10`
        );

        if (!response.ok) {
            return { error: 'Search failed', results: [] };
        }

        const data = await response.json();
        const result = {
            domain,
            total: data.total || 0,
            results: data.results?.slice(0, 10).map((r: any) => ({
                url: r.page?.url,
                domain: r.page?.domain,
                ip: r.page?.ip,
                country: r.page?.country,
                date: r.task?.time,
                screenshot: r.screenshot,
                resultUrl: r.result
            })) || [],
            timestamp: new Date().toISOString()
        };

        await redis.setex(cacheKey, 3600, JSON.stringify(result));
        return result;

    } catch (error: any) {
        return { error: error.message, results: [] };
    }
}
