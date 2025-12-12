import { redis } from '../redis.js';

const CRTSH_API_URL = 'https://crt.sh';
const HACKERTARGET_API_URL = 'https://api.hackertarget.com/hostsearch';

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fallback 1: HackerTarget API (Free, no key needed, 100 requests/day)
 */
async function fetchFromHackerTarget(domain: string): Promise<Set<string>> {
    const subdomains = new Set<string>();
    const normalizedDomain = domain.toLowerCase();

    try {
        console.log(`[HackerTarget] Fetching subdomains for ${normalizedDomain}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${HACKERTARGET_API_URL}/?q=${encodeURIComponent(normalizedDomain)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DomainScope/1.0)'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[HackerTarget] API Error: ${response.status}`);
            return subdomains;
        }

        const text = await response.text();

        // Check for error responses
        if (text.includes('error') || text.includes('API count exceeded')) {
            console.warn(`[HackerTarget] API limit or error: ${text.substring(0, 100)}`);
            return subdomains;
        }

        // Parse CSV-like response: subdomain,ip
        const lines = text.split('\n');
        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 1) {
                const subdomain = parts[0]?.trim().toLowerCase() || '';
                if (subdomain && subdomain.endsWith(normalizedDomain) && subdomain !== normalizedDomain) {
                    subdomains.add(subdomain);
                }
            }
        }

        console.log(`[HackerTarget] Found ${subdomains.size} subdomains`);
    } catch (error: any) {
        console.warn(`[HackerTarget] Error: ${error.message}`);
    }

    return subdomains;
}

/**
 * Fallback 2: AlienVault OTX (Free with API key, has passive DNS data)
 */
async function fetchFromAlienVaultOTX(domain: string): Promise<Set<string>> {
    const subdomains = new Set<string>();
    const normalizedDomain = domain.toLowerCase();
    const otxKey = process.env.ALIENVAULT_OTX_KEY;

    if (!otxKey) {
        console.log('[AlienVault OTX] No API key configured, skipping...');
        return subdomains;
    }

    try {
        console.log(`[AlienVault OTX] Fetching passive DNS for ${normalizedDomain}...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(
            `https://otx.alienvault.com/api/v1/indicators/domain/${encodeURIComponent(normalizedDomain)}/passive_dns`,
            {
                headers: {
                    'X-OTX-API-KEY': otxKey,
                    'User-Agent': 'Mozilla/5.0 (compatible; DomainScope/1.0)'
                },
                signal: controller.signal
            }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[AlienVault OTX] API Error: ${response.status}`);
            return subdomains;
        }

        const data = await response.json() as any;

        if (data.passive_dns && Array.isArray(data.passive_dns)) {
            for (const record of data.passive_dns) {
                const hostname = (record.hostname || '').toLowerCase();
                if (hostname && hostname.endsWith(normalizedDomain) && hostname !== normalizedDomain) {
                    subdomains.add(hostname);
                }
            }
        }

        console.log(`[AlienVault OTX] Found ${subdomains.size} subdomains from passive DNS`);
    } catch (error: any) {
        console.warn(`[AlienVault OTX] Error: ${error.message}`);
    }

    return subdomains;
}

/**
 * Primary: crt.sh (Certificate Transparency logs)
 */
async function fetchFromCrtSh(domain: string): Promise<{ subdomains: Set<string>; success: boolean }> {
    const subdomains = new Set<string>();
    const normalizedDomain = domain.toLowerCase();

    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
        try {
            console.log(`[CrtSh] Fetching subdomains for ${normalizedDomain} (Attempt ${attempt + 1}/${maxRetries + 1})...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(`${CRTSH_API_URL}/?q=%.${normalizedDomain}&output=json`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DomainScope/1.0; +https://github.com/yourusername/domainscope)'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`[CrtSh] API Error: ${response.status} ${response.statusText}`);

                if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
                    throw new Error(`Retryable status ${response.status}`);
                }

                return { subdomains, success: false };
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                console.warn('[CrtSh] Unexpected response format');
                return { subdomains, success: true };
            }

            data.forEach((entry: any) => {
                const nameValue = entry.name_value;
                if (nameValue) {
                    const names = nameValue.split('\n');
                    names.forEach((name: string) => {
                        const cleanName = name.trim().replace(/^\*\./, '').toLowerCase();
                        if (cleanName.endsWith(normalizedDomain) && cleanName !== normalizedDomain) {
                            subdomains.add(cleanName);
                        }
                    });
                }
            });

            console.log(`[CrtSh] Found ${subdomains.size} subdomains`);
            return { subdomains, success: true };

        } catch (error: any) {
            const isTimeout = error.name === 'AbortError';
            const isRetryable = isTimeout || error.message.includes('Retryable');

            if (isRetryable && attempt < maxRetries) {
                const backoff = Math.pow(2, attempt + 1) * 1000;
                console.log(`[CrtSh] Attempt ${attempt + 1} failed. Retrying in ${backoff}ms...`);
                await delay(backoff);
                attempt++;
                continue;
            }

            console.error(`[CrtSh] Error for ${domain}:`, error.message);
            return { subdomains, success: false };
        }
    }

    return { subdomains, success: false };
}

/**
 * Main subdomain discovery function with fallbacks
 * Priority: crt.sh → HackerTarget → AlienVault OTX
 * Results from all successful sources are merged
 */
export async function checkCrtSh(domain: string) {
    const normalizedDomain = domain.toLowerCase();
    const cacheKey = `crtsh_v3:${normalizedDomain}`;

    // Check cache first
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Subdomain] Returning cached result for ${normalizedDomain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Subdomain] Redis cache error:', err);
    }

    // Collect subdomains from all sources
    const allSubdomains = new Set<string>();
    const sources: string[] = [];

    // 1. Try crt.sh (Primary source)
    const crtshResult = await fetchFromCrtSh(normalizedDomain);
    if (crtshResult.success) {
        sources.push('crt.sh');
        crtshResult.subdomains.forEach(sub => allSubdomains.add(sub));
    }

    // 2. If crt.sh failed or returned few results, try fallbacks
    const needsFallback = !crtshResult.success || crtshResult.subdomains.size < 5;

    if (needsFallback) {
        console.log(`[Subdomain] Using fallback sources (crt.sh ${crtshResult.success ? 'returned few results' : 'failed'})...`);

        // Try both fallbacks in parallel for speed
        const [hackerTargetSubs, otxSubs] = await Promise.all([
            fetchFromHackerTarget(normalizedDomain),
            fetchFromAlienVaultOTX(normalizedDomain)
        ]);

        if (hackerTargetSubs.size > 0) {
            sources.push('HackerTarget');
            hackerTargetSubs.forEach(sub => allSubdomains.add(sub));
        }

        if (otxSubs.size > 0) {
            sources.push('AlienVault OTX');
            otxSubs.forEach(sub => allSubdomains.add(sub));
        }
    }

    // Build result
    const result = {
        subdomains: Array.from(allSubdomains).sort(),
        count: allSubdomains.size,
        sources: sources,
        timestamp: new Date().toISOString()
    };

    // Cache for 24 hours if we found results
    if (result.count > 0) {
        try {
            await redis.setex(cacheKey, 86400, JSON.stringify(result));
        } catch (err) {
            console.warn('[Subdomain] Failed to cache result:', err);
        }
    }

    // If no results from any source, return error
    if (result.count === 0 && !crtshResult.success) {
        return {
            error: 'Failed to fetch subdomains. All sources unavailable.',
            subdomains: [],
            count: 0
        };
    }

    console.log(`[Subdomain] Total: ${result.count} unique subdomains from ${sources.join(', ') || 'cache'}`);
    return result;
}

