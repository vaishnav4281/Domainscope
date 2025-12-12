import { redis } from '../redis.js';

/**
 * AlienVault OTX (Open Threat Exchange) API Integration
 * Free tier: Unlimited requests
 * API Key rotation for redundancy
 */

const OTX_KEYS = [
    process.env.ALIENVAULT_OTX_KEY,
    process.env.ALIENVAULT_OTX_KEY_2,
    process.env.ALIENVAULT_OTX_KEY_3
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextKey = () => {
    if (OTX_KEYS.length === 0) return null;
    const key = OTX_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % OTX_KEYS.length;
    return key;
};

export async function checkAlienVaultOTX(domain: string) {
    const cacheKey = `otx:${domain}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[AlienVault-OTX] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[AlienVault-OTX] Cache error:', err);
    }

    if (OTX_KEYS.length === 0) {
        console.warn('No ALIENVAULT_OTX_KEY set');
        return {
            error: 'API key not configured',
            available: false
        };
    }

    // Try each API key
    for (let i = 0; i < OTX_KEYS.length; i++) {
        const apiKey = getNextKey();
        if (!apiKey) continue;

        try {
            // Fetch general info and reputation
            const [generalResponse, reputationResponse] = await Promise.allSettled([
                fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`, {
                    headers: { 'X-OTX-API-KEY': apiKey }
                }),
                fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}/url_list`, {
                    headers: { 'X-OTX-API-KEY': apiKey }
                })
            ]);

            if (generalResponse.status === 'rejected' ||
                (generalResponse.status === 'fulfilled' && generalResponse.value.status === 429)) {
                console.warn(`[AlienVault-OTX] Key ${i + 1} rate limited, trying next...`);
                continue;
            }

            if (generalResponse.status === 'fulfilled' && !generalResponse.value.ok) {
                const errorText = await generalResponse.value.text();
                console.warn(`[AlienVault-OTX] API Error: ${generalResponse.value.status} - ${errorText}`);
                if (generalResponse.value.status === 401 || generalResponse.value.status === 403) continue;
                return { error: `API Error: ${generalResponse.value.status}` };
            }

            let generalData: any = {};
            let urlData: any = {};

            if (generalResponse.status === 'fulfilled' && generalResponse.value.ok) {
                generalData = await generalResponse.value.json();
            }

            if (reputationResponse.status === 'fulfilled' && reputationResponse.value.ok) {
                urlData = await reputationResponse.value.json();
            }

            const result = {
                domain,
                pulseCount: generalData.pulse_info?.count || 0,
                pulses: generalData.pulse_info?.pulses?.slice(0, 5).map((p: any) => ({
                    name: p.name,
                    description: p.description,
                    created: p.created,
                    modified: p.modified,
                    subscriber_count: p.subscriber_count,
                    tags: p.tags,
                    references: p.references
                })) || [],
                whois: generalData.whois || null,
                alexa: generalData.alexa || null,
                indicator: generalData.indicator || domain,
                type: generalData.type_title || 'domain',
                urlList: urlData.url_list?.slice(0, 10).map((u: any) => ({
                    url: u.url,
                    date: u.date,
                    domain: u.domain,
                    result: u.result
                })) || [],
                reputation: {
                    hasPulses: (generalData.pulse_info?.count || 0) > 0,
                    pulseCount: generalData.pulse_info?.count || 0,
                    malicious: (generalData.pulse_info?.count || 0) > 5, // Heuristic
                },
                timestamp: new Date().toISOString()
            };

            // Cache for 24 hours
            await redis.setex(cacheKey, 86400, JSON.stringify(result));
            return result;

        } catch (error: any) {
            console.error(`[AlienVault-OTX] Error with key ${i + 1}:`, error.message);
        }
    }

    return { error: 'All API keys exhausted or failed' };
}
