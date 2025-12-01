const ABUSEIPDB_KEYS = [
    process.env.ABUSEIPDB_API_KEY,
    process.env.ABUSEIPDB_API_KEY_2,
    process.env.ABUSEIPDB_API_KEY_3,
    process.env.VITE_ABUSEIPDB_API_KEY,
    process.env.VITE_ABUSEIPDB_API_KEY_2,
    process.env.VITE_ABUSEIPDB_API_KEY_3
].filter(Boolean) as string[];

let currentKeyIndex = 0;

const getNextKey = () => {
    if (ABUSEIPDB_KEYS.length === 0) return null;
    const key = ABUSEIPDB_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % ABUSEIPDB_KEYS.length;
    return key;
};

const ABUSEIPDB_API_URL = 'https://api.abuseipdb.com/api/v2/check';

export async function checkAbuseIPDB(ip: string) {
    if (ABUSEIPDB_KEYS.length === 0) {
        console.warn('ABUSEIPDB_API_KEY not set');
        return null;
    }

    let attempts = 0;
    const maxAttempts = ABUSEIPDB_KEYS.length;

    while (attempts < maxAttempts) {
        const apiKey = getNextKey();
        if (!apiKey) break;

        try {
            const url = new URL(ABUSEIPDB_API_URL);
            url.searchParams.append('ipAddress', ip);
            url.searchParams.append('maxAgeInDays', '90');
            url.searchParams.append('verbose', 'true');

            const response = await fetch(url.toString(), {
                headers: {
                    'Key': apiKey,
                    'Accept': 'application/json'
                }
            });

            if (response.status === 429 || response.status === 402) {
                console.warn(`AbuseIPDB key exhausted (Status: ${response.status}), rotating...`);
                attempts++;
                continue;
            }

            if (!response.ok) {
                throw new Error(`AbuseIPDB API Error: ${response.statusText}`);
            }

            const result: any = await response.json();
            return {
                data: {
                    abuseConfidenceScore: result.data?.abuseConfidenceScore || 0,
                    usageType: result.data?.usageType || null,
                    isp: result.data?.isp || null,
                    domain: result.data?.domain || null,
                    countryCode: result.data?.countryCode || null,
                    isWhitelisted: result.data?.isWhitelisted || false,
                    totalReports: result.data?.totalReports || 0
                }
            };
        } catch (error: any) {
            console.error('AbuseIPDB check error:', error.message);
            // If it's a network error, maybe don't rotate? But for safety we can just return null or try next.
            // For now, let's assume non-429 errors are fatal for this request unless we want to be very aggressive.
            // But to be safe and simple, we'll stop if it's not a quota issue.
            return null;
        }
    }

    console.error('All AbuseIPDB keys failed or exhausted.');
    return null;
}
