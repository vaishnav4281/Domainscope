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

// Initialize IP2Location keys
const IP2LOCATION_KEYS = [
    process.env.IP2LOCATION_API_KEY,
    process.env.IP2LOCATION_API_KEY_2,
    process.env.IP2LOCATION_API_KEY_3
].filter(Boolean) as string[];

let currentIpInfoIndex = 0;
let currentProxyCheckIndex = 0;
let currentIp2LocationIndex = 0;

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

const getNextIp2LocationKey = () => {
    if (IP2LOCATION_KEYS.length === 0) return null;
    const key = IP2LOCATION_KEYS[currentIp2LocationIndex];
    currentIp2LocationIndex = (currentIp2LocationIndex + 1) % IP2LOCATION_KEYS.length;
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

    // 3. Fallback to IP2Location.io REST API if result is still missing or incomplete
    const needsIp2Location = !result || !result.country_code || !result.ISP;

    if (needsIp2Location && IP2LOCATION_KEYS.length > 0) {
        console.log(`[IP2Location] Fallback for IP: ${ip}`);

        for (let i = 0; i < IP2LOCATION_KEYS.length; i++) {
            const apiKey = getNextIp2LocationKey();
            if (!apiKey) continue;

            try {
                // Use IP2Location.io REST API directly (more reliable than npm package)
                const ip2locUrl = `https://api.ip2location.io/?key=${apiKey}&ip=${encodeURIComponent(ip)}`;
                const response = await fetch(ip2locUrl);
                const data = await response.json() as any;

                if (data && !data.error) {
                    console.log(`[IP2Location] Data found for ${ip}`);

                    if (!result) {
                        // Build new result from IP2Location
                        result = {
                            fraud_score: data.is_proxy ? 75 : 0,
                            vpn: false, // IP2Location free tier doesn't have VPN detection
                            proxy: data.is_proxy || false,
                            tor: false,
                            country_code: data.country_code || null,
                            region: data.region_name || null,
                            city: data.city_name || null,
                            latitude: data.latitude || null,
                            longitude: data.longitude || null,
                            ISP: data.isp || data.as_name || null,
                            organization: data.as_name || null
                        };
                    } else {
                        // Fill in missing fields from IP2Location
                        if (!result.country_code && data.country_code) result.country_code = data.country_code;
                        if (!result.region && data.region_name) result.region = data.region_name;
                        if (!result.city && data.city_name) result.city = data.city_name;
                        if (!result.latitude && data.latitude) result.latitude = data.latitude;
                        if (!result.longitude && data.longitude) result.longitude = data.longitude;
                        if (!result.ISP && (data.isp || data.as_name)) result.ISP = data.isp || data.as_name;
                        if (!result.organization && data.as_name) result.organization = data.as_name;
                        if (data.is_proxy && !result.proxy) {
                            result.proxy = true;
                            result.fraud_score = Math.max(result.fraud_score || 0, 75);
                        }
                    }
                    break; // Success
                } else if (data.error) {
                    console.warn(`[IP2Location] API Error: ${data.error.error_message || data.error}`);
                }
            } catch (error: any) {
                console.error(`[IP2Location] Request error with key ${i + 1}:`, error.message);
                // Try next key
            }
        }
    }

    if (!result) {
        console.error('[IPQS] All providers failed (IPInfo, ProxyCheck, IP2Location)');
    }

    return result;
}

