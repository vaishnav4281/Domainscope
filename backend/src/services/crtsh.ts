import { redis } from '../redis.js';

const CRTSH_API_URL = 'https://crt.sh';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function checkCrtSh(domain: string) {
    const cacheKey = `crtsh:${domain}`;

    // Check cache first
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[CrtSh] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[CrtSh] Redis cache error:', err);
    }

    let attempt = 0;
    const maxRetries = 2; // 0, 1, 2 = 3 attempts total

    while (attempt <= maxRetries) {
        try {
            console.log(`[CrtSh] Fetching subdomains for ${domain} (Attempt ${attempt + 1}/${maxRetries + 1})...`);

            const controller = new AbortController();
            // Increased timeout to 60s for mobile networks and slow crt.sh responses
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(`${CRTSH_API_URL}/?q=%.${domain}&output=json`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DomainScope/1.0; +https://github.com/yourusername/domainscope)'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`[CrtSh] API Error: ${response.status} ${response.statusText}`);

                // If 429 or 5xx, throw to trigger retry (unless it's the last attempt)
                if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
                    throw new Error(`Retryable status ${response.status}`);
                }

                if (response.status === 429) {
                    return { error: 'Rate limit exceeded. Try again in a few minutes.' };
                } else if (response.status >= 500) {
                    return { error: 'crt.sh service temporarily unavailable. Try again later.' };
                }

                return { error: `crt.sh API Error: ${response.status}` };
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                console.warn('[CrtSh] Unexpected response format');
                return { subdomains: [] };
            }

            // Extract and deduplicate subdomains
            const subdomains = new Set<string>();
            data.forEach((entry: any) => {
                const nameValue = entry.name_value;
                if (nameValue) {
                    const names = nameValue.split('\n');
                    names.forEach((name: string) => {
                        // Clean up the name (remove *. prefix if present)
                        const cleanName = name.trim().replace(/^\*\./, '');
                        // Ensure it ends with the target domain to filter out unrelated results (though crt.sh query should handle this)
                        if (cleanName.endsWith(domain) && cleanName !== domain) {
                            subdomains.add(cleanName);
                        }
                    });
                }
            });

            const result = {
                subdomains: Array.from(subdomains).sort(),
                count: subdomains.size,
                timestamp: new Date().toISOString()
            };

            // Cache for 24 hours (86400 seconds)
            try {
                await redis.setex(cacheKey, 86400, JSON.stringify(result));
            } catch (err) {
                console.warn('[CrtSh] Failed to cache result:', err);
            }

            return result;

        } catch (error: any) {
            const isTimeout = error.name === 'AbortError';
            const isRetryable = isTimeout || error.message.includes('Retryable');

            if (isRetryable && attempt < maxRetries) {
                const backoff = Math.pow(2, attempt + 1) * 1000; // 2s, 4s
                console.log(`[CrtSh] Attempt ${attempt + 1} failed. Retrying in ${backoff}ms...`);
                await delay(backoff);
                attempt++;
                continue;
            }

            if (isTimeout) {
                console.error(`[CrtSh] Request timeout for ${domain} after ${attempt + 1} attempts`);
                return { error: 'Request timed out. crt.sh may be slow or your connection is unstable.' };
            }

            console.error(`[CrtSh] Error fetching data for ${domain}:`, error.message);
            return { error: 'Failed to fetch subdomains from crt.sh' };
        }
    }

    return { error: 'Failed to fetch subdomains after multiple attempts' };
}
