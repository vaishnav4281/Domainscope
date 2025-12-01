import { IPinfoWrapper, type IPinfo } from 'node-ipinfo';

// Initialize IPinfo clients with API tokens from environment
const IPINFO_TOKENS = [
    process.env.IPINFO_TOKEN,
    process.env.IPINFO_TOKEN_2,
    process.env.IPINFO_TOKEN_3
].filter(Boolean) as string[];

// Initialize ProxyCheck keys
const PROXYCHECK_KEYS = [
    process.env.PROXYCHECK_API_KEY,
    process.env.PROXYCHECK_API_KEY_2,
    process.env.PROXYCHECK_API_KEY_3
].filter(Boolean) as string[];

let currentIpInfoIndex = 0;
let currentProxyCheckIndex = 0;

const getNextIpInfoToken = () => {
    if (IPINFO_TOKENS.length === 0) return null;
    const token = IPINFO_TOKENS[currentIpInfoIndex];
    currentIpInfoIndex = (currentIpInfoIndex + 1) % IPINFO_TOKENS.length;
    return token;
};

const getNextProxyCheckKey = () => {
    if (PROXYCHECK_KEYS.length === 0) return null;
    const key = PROXYCHECK_KEYS[currentProxyCheckIndex];
    currentProxyCheckIndex = (currentProxyCheckIndex + 1) % PROXYCHECK_KEYS.length;
    return key;
};

/**
 * Check IP intelligence using ipinfo npm module and proxycheck.io
 * Maps data to the same structure as the old IPQS service for UI compatibility
 * Supports token rotation across up to 3 keys for ipinfo and proxycheck
 */
export async function checkIPQS(ip: string) {
    let result: any = null;

    // 1. Fetch from IPInfo (Primary source for location/ISP)
    if (IPINFO_TOKENS.length > 0) {
        console.log(`[IPInfo] Checking IP: ${ip}`);
        // Try with rotated tokens
        for (let i = 0; i < IPINFO_TOKENS.length; i++) {
            const token = getNextIpInfoToken();
            if (!token) continue;

            try {
                const ipinfoClient = new IPinfoWrapper(token);

                // Fetch IP information from ipinfo
                const data: IPinfo = await ipinfoClient.lookupIp(ip);

                // Calculate a basic risk score based on privacy detection
                // ipinfo provides privacy data including vpn, proxy, tor, hosting
                const privacyData = data.privacy || {};
                let fraud_score = 0;

                // Increment fraud score based on privacy indicators
                if (privacyData.vpn) fraud_score += 25;
                if (privacyData.proxy) fraud_score += 25;
                if (privacyData.tor) fraud_score += 30;
                if (privacyData.hosting) fraud_score += 20;

                // Parse location coordinates
                const [latitude, longitude] = data.loc ? data.loc.split(',').map(Number) : [null, null];

                // Map ipinfo response to the same structure as IPQS for UI compatibility
                result = {
                    fraud_score: Math.min(fraud_score, 100), // Cap at 100
                    vpn: privacyData.vpn || false,
                    proxy: privacyData.proxy || false,
                    tor: privacyData.tor || false,
                    country_code: data.country || null,
                    region: data.region || null,
                    city: data.city || null,
                    latitude: latitude || null,
                    longitude: longitude || null,
                    ISP: data.org || null, // ipinfo uses 'org' field for ISP/Organization
                    organization: data.org || null
                };
                break; // Success, exit loop
            } catch (error: any) {
                console.error(`[IPInfo] Request error with token ${i + 1}:`, error.message);
                // If error is 429 (Too Many Requests), loop will continue to next token
            }
        }
    } else {
        console.warn('[IPInfo] No IPINFO_TOKENs set');
    }

    // 2. Fetch from ProxyCheck (Enhanced Security Detection)
    // We do this to supplement/override IPInfo's detection, especially if IPInfo missed it
    // We also support key rotation here
    const maxRetries = Math.max(PROXYCHECK_KEYS.length, 1); // Try at least once (even without key) or rotate through keys

    for (let i = 0; i < maxRetries; i++) {
        try {
            const key = getNextProxyCheckKey();
            console.log(`[ProxyCheck] Checking IP: ${ip} (Key ${i + 1}/${maxRetries})`);

            const proxyCheckUrl = `http://proxycheck.io/v2/${ip}?vpn=1&asn=1${key ? `&key=${key}` : ''}`;

            // Use global fetch (Node 18+)
            const response = await fetch(proxyCheckUrl);
            const proxyDataRaw = await response.json() as any;

            if (proxyDataRaw.status === 'ok' && proxyDataRaw[ip]) {
                const pcData = proxyDataRaw[ip];
                console.log(`[ProxyCheck] Data found for ${ip}: Proxy=${pcData.proxy}, Risk=${pcData.risk}`);

                // If we have no result from IPInfo (e.g. keys failed), build one from ProxyCheck
                if (!result) {
                    result = {
                        fraud_score: pcData.risk ? parseInt(pcData.risk) : 0,
                        vpn: pcData.proxy === 'yes' && pcData.type === 'VPN',
                        proxy: pcData.proxy === 'yes',
                        tor: pcData.type === 'TOR', // inferred if type is TOR
                        country_code: pcData.isocode || null,
                        region: pcData.region || null,
                        city: pcData.city || null,
                        latitude: pcData.latitude ? Number(pcData.latitude) : null,
                        longitude: pcData.longitude ? Number(pcData.longitude) : null,
                        ISP: pcData.provider || pcData.asn || null,
                        organization: pcData.organisation || pcData.provider || null
                    };
                } else {
                    // Merge/Override IPInfo result with ProxyCheck's superior detection
                    // If ProxyCheck says it's a proxy/vpn, we trust it over IPInfo's "false"
                    if (pcData.proxy === 'yes') {
                        result.proxy = true;
                        if (pcData.type === 'VPN') result.vpn = true;
                        if (pcData.type === 'TOR') result.tor = true;

                        // Boost fraud score if ProxyCheck says it's bad
                        // ProxyCheck risk is 0-100
                        if (pcData.risk) {
                            result.fraud_score = Math.max(result.fraud_score, parseInt(pcData.risk));
                        } else {
                            // If no risk score but detected as proxy, ensure at least some risk
                            result.fraud_score = Math.max(result.fraud_score, 75);
                        }
                    }
                }
                break; // Success, stop trying keys
            } else if (proxyDataRaw.status === 'denied') {
                // Key exhausted or invalid, try next key
                console.warn(`[ProxyCheck] Key denied: ${proxyDataRaw.message}`);
                continue;
            }
        } catch (error: any) {
            console.error('[ProxyCheck] Request error:', error.message);
            // Try next key on error
        }
    }

    if (!result) {
        console.error('[IPQS] All providers failed');
    }

    return result;
}
