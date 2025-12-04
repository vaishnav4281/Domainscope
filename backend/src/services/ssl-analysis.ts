import tls from 'node:tls';
import { redis } from '../redis.js';

/**
 * SSL/TLS Certificate Analysis Service
 * Provides comprehensive certificate inspection
 */

export async function analyzeCertificate(domain: string) {
    const cacheKey = `ssl_cert:${domain.toLowerCase()}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[SSL-Cert] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[SSL-Cert] Cache error:', err);
    }

    try {
        const certInfo = await fetchCertificate(domain);

        // Cache for 24 hours
        try {
            await redis.setex(cacheKey, 86400, JSON.stringify(certInfo));
        } catch (err) {
            console.warn('[SSL-Cert] Failed to cache:', err);
        }

        return certInfo;
    } catch (error: any) {
        return {
            domain,
            error: error.message || 'Failed to fetch certificate',
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Fetch SSL certificate details
 */
async function fetchCertificate(domain: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const options = {
            host: domain,
            port: 443,
            servername: domain,
            rejectUnauthorized: false, // Allow self-signed certs for analysis
        };

        const socket = tls.connect(options, () => {
            const cert = socket.getPeerCertificate(true);

            if (!cert || Object.keys(cert).length === 0) {
                socket.destroy();
                reject(new Error('No certificate found'));
                return;
            }

            const result = {
                domain,
                certificate: {
                    subject: cert.subject,
                    issuer: cert.issuer,
                    subjectAltNames: cert.subjectaltname?.split(', ') || [],
                    validFrom: cert.valid_from,
                    validTo: cert.valid_to,
                    daysRemaining: calculateDaysRemaining(cert.valid_to),
                    serialNumber: cert.serialNumber,
                    fingerprint: cert.fingerprint,
                    fingerprint256: cert.fingerprint256,
                },
                validity: {
                    isValid: new Date() < new Date(cert.valid_to) && new Date() > new Date(cert.valid_from),
                    isExpired: new Date() > new Date(cert.valid_to),
                    expiresIn: calculateDaysRemaining(cert.valid_to),
                    warning: calculateDaysRemaining(cert.valid_to) < 30
                },
                chain: extractCertificateChain(cert),
                protocol: {
                    version: socket.getProtocol(),
                    cipher: socket.getCipher(),
                },
                score: calculateSSLScore(cert, socket),
                grade: getSSLGrade(calculateSSLScore(cert, socket)),
                recommendations: generateSSLRecommendations(cert, socket),
                timestamp: new Date().toISOString()
            };

            socket.destroy();
            resolve(result);
        });

        socket.on('error', (error) => {
            reject(error);
        });

        // Timeout after 10 seconds
        socket.setTimeout(10000, () => {
            socket.destroy();
            reject(new Error('Connection timeout'));
        });
    });
}

/**
 * Calculate days remaining until certificate expiration
 */
function calculateDaysRemaining(validTo: string): number {
    const expiryDate = new Date(validTo);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Extract certificate chain
 */
function extractCertificateChain(cert: any): any[] {
    const chain: any[] = [];
    let current = cert;

    while (current && current.issuerCertificate) {
        chain.push({
            subject: current.subject?.CN || 'Unknown',
            issuer: current.issuer?.CN || 'Unknown',
            validFrom: current.valid_from,
            validTo: current.valid_to
        });

        // Prevent infinite loop (self-signed or circular chain)
        if (current.fingerprint === current.issuerCertificate?.fingerprint) {
            break;
        }

        current = current.issuerCertificate;
    }

    return chain;
}

/**
 * Calculate SSL security score (0-100)
 */
function calculateSSLScore(cert: any, socket: any): number {
    let score = 100;

    // Check protocol version
    const protocol = socket.getProtocol();
    if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
        score -= 30; // Old protocols
    } else if (protocol === 'TLSv1.2') {
        score -= 10; // Good but not latest
    }

    // Check cipher strength
    const cipher = socket.getCipher();
    if (cipher && cipher.name) {
        if (cipher.name.includes('RC4') || cipher.name.includes('DES')) {
            score -= 40; // Weak ciphers
        } else if (cipher.name.includes('AES128')) {
            score -= 5; // Adequate
        }
    }

    // Check certificate validity period
    const daysRemaining = calculateDaysRemaining(cert.valid_to);
    if (daysRemaining < 0) {
        score -= 50; // Expired
    } else if (daysRemaining < 30) {
        score -= 20; // Expiring soon
    }

    // Check if self-signed
    if (cert.issuer?.CN === cert.subject?.CN) {
        score -= 30; // Self-signed
    }

    return Math.max(score, 0);
}

/**
 * Convert SSL score to letter grade
 */
function getSSLGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Generate SSL recommendations
 */
function generateSSLRecommendations(cert: any, socket: any): string[] {
    const recommendations: string[] = [];

    const protocol = socket.getProtocol();
    if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
        recommendations.push('Upgrade to TLS 1.2 or TLS 1.3');
    } else if (protocol === 'TLSv1.2') {
        recommendations.push('Consider upgrading to TLS 1.3 for improved security');
    }

    const daysRemaining = calculateDaysRemaining(cert.valid_to);
    if (daysRemaining < 0) {
        recommendations.push('Certificate has EXPIRED - renew immediately!');
    } else if (daysRemaining < 30) {
        recommendations.push(`Certificate expires in ${daysRemaining} days - renew soon`);
    }

    const cipher = socket.getCipher();
    if (cipher && cipher.name) {
        if (cipher.name.includes('RC4') || cipher.name.includes('DES')) {
            recommendations.push('Weak cipher detected - upgrade cipher suite');
        }
    }

    if (cert.issuer?.CN === cert.subject?.CN) {
        recommendations.push('Self-signed certificate - use a trusted CA');
    }

    if (recommendations.length === 0) {
        recommendations.push('SSL/TLS configuration is excellent!');
    }

    return recommendations;
}
