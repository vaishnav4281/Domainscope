import { redis } from '../redis.js';

const CRTSH_API_URL = 'https://crt.sh';

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

    try {
        console.log(`[CrtSh] Fetching subdomains for ${domain}...`);
        // Fetch from crt.sh
        // %.domain matches all subdomains
        const response = await fetch(`${CRTSH_API_URL}/?q=%.${domain}&output=json`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DomainScope/1.0; +https://github.com/yourusername/domainscope)'
            }
        });

        if (!response.ok) {
            console.warn(`[CrtSh] API Error: ${response.status} ${response.statusText}`);
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
        console.error(`[CrtSh] Error fetching data for ${domain}:`, error.message);
        return { error: 'Failed to fetch subdomains from crt.sh' };
    }
}
