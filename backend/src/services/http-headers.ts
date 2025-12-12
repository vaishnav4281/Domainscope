import { redis } from '../redis.js';

/**
 * HTTP Security Headers Analysis Service
 */

export async function analyzeSecurityHeaders(domain: string) {
    const cacheKey = `http_headers:${domain.toLowerCase()}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[HTTP-Headers] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[HTTP-Headers] Cache error:', err);
    }

    try {
        const headers = await fetchSecurityHeaders(domain);

        // Cache for 6 hours
        try {
            await redis.setex(cacheKey, 21600, JSON.stringify(headers));
        } catch (err) {
            console.warn('[HTTP-Headers] Failed to cache:', err);
        }

        return headers;
    } catch (error: any) {
        return {
            domain,
            error: error.message || 'Failed to fetch headers',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Fetch and analyze HTTP security headers
 */
async function fetchSecurityHeaders(domain: string): Promise<any> {
    const urls = [
        `https://${domain}`,
        `http://${domain}`
    ];

    let response: Response | null = null;

    // Try HTTPS first, then HTTP
    for (const url of urls) {
        try {
            response = await fetch(url, {
                method: 'HEAD',
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DomainScope/1.0)'
                }
            });
            break;
        } catch (error) {
            // Try next URL
        }
    }

    if (!response) {
        throw new Error('Unable to connect to domain');
    }

    const headers = Object.fromEntries(response.headers.entries());

    // Analyze security headers
    const analysis = {
        domain,
        url: response.url,
        headers: {
            // Security Headers
            'strict-transport-security': headers['strict-transport-security'] || null,
            'content-security-policy': headers['content-security-policy'] || null,
            'x-frame-options': headers['x-frame-options'] || null,
            'x-content-type-options': headers['x-content-type-options'] || null,
            'x-xss-protection': headers['x-xss-protection'] || null,
            'referrer-policy': headers['referrer-policy'] || null,
            'permissions-policy': headers['permissions-policy'] || null,
            'cross-origin-embedder-policy': headers['cross-origin-embedder-policy'] || null,
            'cross-origin-opener-policy': headers['cross-origin-opener-policy'] || null,
            'cross-origin-resource-policy': headers['cross-origin-resource-policy'] || null,

            // Server Info
            'server': headers['server'] || null,
            'x-powered-by': headers['x-powered-by'] || null,

            // Other
            'content-type': headers['content-type'] || null,
        },
        security: {
            hasHSTS: !!headers['strict-transport-security'],
            hasCSP: !!headers['content-security-policy'],
            hasFrameOptions: !!headers['x-frame-options'],
            hasContentTypeOptions: !!headers['x-content-type-options'],
            hasXSSProtection: !!headers['x-xss-protection'],
            hasReferrerPolicy: !!headers['referrer-policy'],
            hasPermissionsPolicy: !!headers['permissions-policy'],
            serverInfoExposed: !!(headers['server'] || headers['x-powered-by']),
        },
        score: 0,
        grade: 'F',
        recommendations: [] as string[],
        timestamp: new Date().toISOString()
    };

    // Calculate security score
    analysis.score = calculateHeaderScore(analysis);
    analysis.grade = getHeaderGrade(analysis.score);
    analysis.recommendations = generateHeaderRecommendations(analysis);

    return analysis;
}

/**
 * Calculate security header score (0-100)
 */
function calculateHeaderScore(analysis: any): number {
    let score = 0;

    // HSTS (20 points)
    if (analysis.security.hasHSTS) {
        score += 20;
        const hstsHeader = analysis.headers['strict-transport-security'];
        if (hstsHeader && hstsHeader.includes('includeSubDomains')) score += 5;
        if (hstsHeader && hstsHeader.includes('preload')) score += 5;
    }

    // CSP (25 points)
    if (analysis.security.hasCSP) {
        score += 25;
    }

    // X-Frame-Options (15 points)
    if (analysis.security.hasFrameOptions) {
        score += 15;
    }

    // X-Content-Type-Options (10 points)
    if (analysis.security.hasContentTypeOptions) {
        score += 10;
    }

    // X-XSS-Protection (5 points - deprecated but still good)
    if (analysis.security.hasXSSProtection) {
        score += 5;
    }

    // Referrer-Policy (10 points)
    if (analysis.security.hasReferrerPolicy) {
        score += 10;
    }

    // Permissions-Policy (10 points)
    if (analysis.security.hasPermissionsPolicy) {
        score += 10;
    }

    // Deduct points for server info exposure (-10)
    if (analysis.security.serverInfoExposed) {
        score -= 10;
    }

    return Math.max(Math.min(score, 100), 0);
}

/**
 * Convert score to letter grade
 */
function getHeaderGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

/**
 * Generate security recommendations
 */
function generateHeaderRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (!analysis.security.hasHSTS) {
        recommendations.push('Add Strict-Transport-Security header to enforce HTTPS');
    } else {
        const hsts = analysis.headers['strict-transport-security'];
        if (hsts && !hsts.includes('includeSubDomains')) {
            recommendations.push('Include subdomains in HSTS policy');
        }
    }

    if (!analysis.security.hasCSP) {
        recommendations.push('Implement Content-Security-Policy to prevent XSS attacks');
    }

    if (!analysis.security.hasFrameOptions) {
        recommendations.push('Add X-Frame-Options to prevent clickjacking');
    }

    if (!analysis.security.hasContentTypeOptions) {
        recommendations.push('Add X-Content-Type-Options: nosniff');
    }

    if (!analysis.security.hasReferrerPolicy) {
        recommendations.push('Set Referrer-Policy for privacy protection');
    }

    if (!analysis.security.hasPermissionsPolicy) {
        recommendations.push('Add Permissions-Policy to control browser features');
    }

    if (analysis.security.serverInfoExposed) {
        recommendations.push('Remove Server and X-Powered-By headers to reduce fingerprinting');
    }

    if (recommendations.length === 0) {
        recommendations.push('Security headers configuration is excellent!');
    }

    return recommendations;
}
