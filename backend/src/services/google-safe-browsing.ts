import { redis } from '../redis.js';

/**
 * Google Safe Browsing API Integration
 * Free tier: 10,000 requests/day = 300,000/month
 * API Key rotation for extended limits
 */

const SAFE_BROWSING_KEYS = [
    process.env.GOOGLE_SAFE_BROWSING_KEY,
    process.env.GOOGLE_SAFE_BROWSING_KEY_2,
    process.env.GOOGLE_SAFE_BROWSING_KEY_3
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextKey = () => {
    if (SAFE_BROWSING_KEYS.length === 0) return null;
    const key = SAFE_BROWSING_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % SAFE_BROWSING_KEYS.length;
    return key;
};

export async function checkGoogleSafeBrowsing(url: string) {
    const cacheKey = `google_safe_browsing:${url}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Google-Safe-Browsing] Returning cached result for ${url}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Google-Safe-Browsing] Cache error:', err);
    }

    if (SAFE_BROWSING_KEYS.length === 0) {
        console.warn('No GOOGLE_SAFE_BROWSING_KEY set');
        return {
            error: 'API key not configured',
            isSafe: null
        };
    }

    // Try each API key
    for (let i = 0; i < SAFE_BROWSING_KEYS.length; i++) {
        const apiKey = getNextKey();
        if (!apiKey) continue;

        try {
            const response = await fetch(
                `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client: {
                            clientId: 'domainscope',
                            clientVersion: '1.0.0'
                        },
                        threatInfo: {
                            threatTypes: [
                                'MALWARE',
                                'SOCIAL_ENGINEERING',
                                'UNWANTED_SOFTWARE',
                                'POTENTIALLY_HARMFUL_APPLICATION'
                            ],
                            platformTypes: ['ANY_PLATFORM'],
                            threatEntryTypes: ['URL'],
                            threatEntries: [{ url }]
                        }
                    })
                }
            );

            if (response.status === 429) {
                console.warn(`[Google-Safe-Browsing] Key ${i + 1} quota exceeded, trying next...`);
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`[Google-Safe-Browsing] API Error: ${response.status} - ${errorText}`);
                if (response.status === 401 || response.status === 403) continue; // Try next key
                return { error: `API Error: ${response.status}` };
            }

            const data = await response.json();
            const result = {
                url,
                isSafe: !data.matches || data.matches.length === 0,
                threats: data.matches || [],
                details: data.matches ? data.matches.map((match: any) => ({
                    threatType: match.threatType,
                    platformType: match.platformType,
                    threat: match.threat
                })) : [],
                timestamp: new Date().toISOString()
            };

            // Cache for 24 hours
            await redis.setex(cacheKey, 86400, JSON.stringify(result));
            return result;

        } catch (error: any) {
            console.error(`[Google-Safe-Browsing] Error with key ${i + 1}:`, error.message);
        }
    }

    return { error: 'All API keys exhausted or failed' };
}
