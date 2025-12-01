import { redis } from '../redis.js';





const VT_API_KEYS = [
    process.env.VT_API_KEY,
    process.env.VT_API_KEY_2,
    process.env.VT_API_KEY_3,
    process.env.VITE_VIRUSTOTAL_API_KEY,
    process.env.VITE_VIRUSTOTAL_API_KEY_2,
    process.env.VITE_VIRUSTOTAL_API_KEY_3
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextKey = () => {
    if (VT_API_KEYS.length === 0) return null;
    const key = VT_API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % VT_API_KEYS.length;
    return key;
};

const VT_API_URL = 'https://www.virustotal.com/api/v3/domains';

export async function checkVirusTotal(domain: string) {
    const cacheKey = `vt:${domain}`;

    // Check cache first
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[VT] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[VT] Redis cache error:', err);
    }

    if (VT_API_KEYS.length === 0) {
        console.warn('No VT_API_KEYs set');
        return null;
    }

    // Try up to the number of keys we have
    for (let i = 0; i < VT_API_KEYS.length; i++) {
        const apiKey = getNextKey();
        if (!apiKey) continue;

        try {
            const [reportRes, resolutionsRes] = await Promise.allSettled([
                fetch(`${VT_API_URL}/${domain}`, {
                    headers: { 'x-apikey': apiKey }
                }),
                fetch(`${VT_API_URL}/${domain}/resolutions?limit=10`, {
                    headers: { 'x-apikey': apiKey }
                })
            ]);

            // Check for Quota Exceeded (429) or Rate Limit (204) on Report
            if (reportRes.status === 'fulfilled') {
                if (reportRes.value.status === 429 || reportRes.value.status === 204) {
                    console.warn(`[VT] Key ${i + 1} quota exceeded (Status: ${reportRes.value.status}), trying next key...`);
                    continue; // Try next key
                }
            }

            let data: any = {};

            if (reportRes.status === 'fulfilled' && reportRes.value.ok) {
                data = await reportRes.value.json();
            } else if (reportRes.status === 'fulfilled' && reportRes.value.status === 404) {
                // Domain not found in VT
            } else if (reportRes.status === 'fulfilled' && !reportRes.value.ok) {
                const errorText = await reportRes.value.text();
                // If it's a 401, it might be an invalid key, but we'll treat it as a failure for this key
                console.warn(`[VT] API Error: ${reportRes.value.status} ${reportRes.value.statusText} - ${errorText}`);
                if (reportRes.value.status === 401) continue; // Try next key if unauthorized
                return { error: `VirusTotal API Error: ${reportRes.value.status} ${reportRes.value.statusText}` };
            }

            let resolutions: any[] = [];
            if (resolutionsRes.status === 'fulfilled') {
                if (resolutionsRes.value.ok) {
                    const resData = await resolutionsRes.value.json();
                    resolutions = resData.data || [];
                    console.log(`[VT] Resolutions fetched: ${resolutions.length} items`);
                } else if (resolutionsRes.value.status === 429 || resolutionsRes.value.status === 204) {
                    console.warn(`[VT] Resolutions quota exceeded (Status: ${resolutionsRes.value.status}), but report might be ok.`);
                    // If report was OK but resolutions failed due to quota, we might want to retry the whole thing with a new key?
                    // For now, let's accept partial data if report succeeded, or retry if report also failed.
                    // But since we check reportRes first, we likely won't reach here if report failed.
                } else {
                    const errText = await resolutionsRes.value.text();
                    console.warn(`[VT] Resolutions API failed: ${resolutionsRes.value.status} ${resolutionsRes.value.statusText} - ${errText}`);
                }
            }

            // Return combined data
            if (data.data) {
                data.resolutions = resolutions;
            } else {
                data = { data: {}, resolutions };
            }

            // Cache the result for 1 hour (3600 seconds)
            if (!data.error) {
                await redis.setex(cacheKey, 3600, JSON.stringify(data));
            }

            return data; // Success!

        } catch (error: any) {
            console.error(`[VT] Error fetching data for ${domain} with key ${i + 1}:`, error.message);
        }
    }

    console.error('[VT] All keys failed or exhausted');
    return { error: 'All VirusTotal API keys exhausted or failed.' };
};
