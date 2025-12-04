import dns from 'node:dns/promises';
import { redis } from '../redis.js';

/**
 * Email Security Analysis Service
 * Checks SPF, DKIM, DMARC, BIMI records and provides deliverability score
 */

interface EmailSecurityResult {
    domain: string;
    spf: any;
    dmarc: any;
    dkim: any;
    bimi: any;
    score: number;
    grade: string;
    recommendations: string[];
    timestamp: string;
}

export async function checkEmailSecurity(domain: string): Promise<EmailSecurityResult> {
    const cacheKey = `email_security:${domain.toLowerCase()}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Email-Security] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Email-Security] Cache error:', err);
    }

    const result: EmailSecurityResult = {
        domain,
        spf: await checkSPF(domain),
        dmarc: await checkDMARC(domain),
        dkim: await checkDKIM(domain),
        bimi: await checkBIMI(domain),
        score: 0,
        grade: 'F',
        recommendations: [],
        timestamp: new Date().toISOString()
    };

    // Calculate deliverability score
    result.score = calculateEmailScore(result);
    result.grade = getEmailGrade(result.score);
    result.recommendations = generateRecommendations(result);

    // Cache for 6 hours
    try {
        await redis.setex(cacheKey, 21600, JSON.stringify(result));
    } catch (err) {
        console.warn('[Email-Security] Failed to cache:', err);
    }

    return result;
}

/**
 * Check SPF (Sender Policy Framework) record
 */
async function checkSPF(domain: string) {
    try {
        const txtRecords = await dns.resolveTxt(domain);
        const spfRecord = txtRecords.find(record =>
            record.join('').toLowerCase().startsWith('v=spf1')
        );

        if (!spfRecord) {
            return {
                exists: false,
                record: null,
                valid: false,
                mechanisms: []
            };
        }

        const recordString = spfRecord.join('');
        const mechanisms = recordString.split(' ').filter(m => m.length > 0);

        return {
            exists: true,
            record: recordString,
            valid: true,
            mechanisms,
            policy: mechanisms[mechanisms.length - 1], // Usually ~all or -all
            includes: mechanisms.filter(m => m.startsWith('include:')),
            ips: mechanisms.filter(m => m.startsWith('ip4:') || m.startsWith('ip6:'))
        };
    } catch (error) {
        return {
            exists: false,
            record: null,
            valid: false,
            error: 'No SPF record found'
        };
    }
}

/**
 * Check DMARC record
 */
async function checkDMARC(domain: string) {
    try {
        const dmarcDomain = `_dmarc.${domain}`;
        const txtRecords = await dns.resolveTxt(dmarcDomain);
        const dmarcRecord = txtRecords.find(record =>
            record.join('').toLowerCase().startsWith('v=dmarc1')
        );

        if (!dmarcRecord) {
            return {
                exists: false,
                record: null,
                valid: false
            };
        }

        const recordString = dmarcRecord.join('');
        const tags = parseDMARCTags(recordString);

        return {
            exists: true,
            record: recordString,
            valid: true,
            policy: tags.p || 'none',
            subdomainPolicy: tags.sp || tags.p || 'none',
            percentage: parseInt(tags.pct || '100', 10),
            reportEmails: {
                aggregate: tags.rua || null,
                forensic: tags.ruf || null
            },
            alignment: {
                dkim: tags.adkim || 'r',
                spf: tags.aspf || 'r'
            }
        };
    } catch (error) {
        return {
            exists: false,
            record: null,
            valid: false,
            error: 'No DMARC record found'
        };
    }
}

/**
 * Check DKIM record (using default selector)
 */
async function checkDKIM(domain: string) {
    const commonSelectors = ['default', 'google', 'k1', 'selector1', 'selector2', 'dkim', 'mail'];
    const foundSelectors: any[] = [];

    for (const selector of commonSelectors) {
        try {
            const dkimDomain = `${selector}._domainkey.${domain}`;
            const txtRecords = await dns.resolveTxt(dkimDomain);
            const dkimRecord = txtRecords.find(record =>
                record.join('').toLowerCase().includes('v=dkim1') ||
                record.join('').toLowerCase().includes('k=rsa')
            );

            if (dkimRecord) {
                foundSelectors.push({
                    selector,
                    record: dkimRecord.join(''),
                    valid: true
                });
            }
        } catch (error) {
            // Selector not found, continue
        }
    }

    return {
        exists: foundSelectors.length > 0,
        selectors: foundSelectors,
        count: foundSelectors.length,
        recommendation: foundSelectors.length === 0
            ? 'No DKIM records found with common selectors'
            : `Found ${foundSelectors.length} DKIM selector(s)`
    };
}

/**
 * Check BIMI (Brand Indicators for Message Identification) record
 */
async function checkBIMI(domain: string) {
    try {
        const bimiDomain = `default._bimi.${domain}`;
        const txtRecords = await dns.resolveTxt(bimiDomain);
        const bimiRecord = txtRecords.find(record =>
            record.join('').toLowerCase().startsWith('v=bimi1')
        );

        if (!bimiRecord) {
            return {
                exists: false,
                record: null
            };
        }

        const recordString = bimiRecord.join('');
        const tags = parseBIMITags(recordString);

        return {
            exists: true,
            record: recordString,
            logoUrl: tags.l || null,
            certificateUrl: tags.a || null
        };
    } catch (error) {
        return {
            exists: false,
            record: null,
            error: 'No BIMI record found'
        };
    }
}

/**
 * Parse DMARC tags into key-value pairs
 */
function parseDMARCTags(record: string): Record<string, string> {
    const tags: Record<string, string> = {};
    const parts = record.split(';').map(p => p.trim()).filter(p => p.length > 0);

    parts.forEach(part => {
        const [key, value] = part.split('=').map(s => s.trim());
        if (key && value) {
            tags[key] = value;
        }
    });

    return tags;
}

/**
 * Parse BIMI tags
 */
function parseBIMITags(record: string): Record<string, string> {
    const tags: Record<string, string> = {};
    const parts = record.split(';').map(p => p.trim()).filter(p => p.length > 0);

    parts.forEach(part => {
        const [key, value] = part.split('=').map(s => s.trim());
        if (key && value) {
            tags[key] = value;
        }
    });

    return tags;
}

/**
 * Calculate email deliverability score (0-100)
 */
function calculateEmailScore(result: EmailSecurityResult): number {
    let score = 0;

    // SPF (30 points)
    if (result.spf.exists && result.spf.valid) {
        score += 30;
    }

    // DMARC (40 points)
    if (result.dmarc.exists && result.dmarc.valid) {
        score += 20;
        if (result.dmarc.policy === 'quarantine') score += 10;
        if (result.dmarc.policy === 'reject') score += 20;
    }

    // DKIM (25 points)
    if (result.dkim.exists && result.dkim.count > 0) {
        score += 15;
        if (result.dkim.count >= 2) score += 10; // Bonus for multiple selectors
    }

    // BIMI (5 bonus points)
    if (result.bimi.exists) {
        score += 5;
    }

    return Math.min(score, 100);
}

/**
 * Convert score to letter grade
 */
function getEmailGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

/**
 * Generate recommendations
 */
function generateRecommendations(result: EmailSecurityResult): string[] {
    const recommendations: string[] = [];

    if (!result.spf.exists) {
        recommendations.push('Add an SPF record to authorize mail servers');
    }

    if (!result.dmarc.exists) {
        recommendations.push('Implement DMARC to prevent email spoofing');
    } else if (result.dmarc.policy === 'none') {
        recommendations.push('Upgrade DMARC policy from "none" to "quarantine" or "reject"');
    }

    if (!result.dkim.exists || result.dkim.count === 0) {
        recommendations.push('Configure DKIM signing for email authentication');
    }

    if (result.dmarc.exists && !result.dmarc.reportEmails.aggregate) {
        recommendations.push('Add DMARC reporting (rua) to monitor email authentication');
    }

    if (recommendations.length === 0) {
        recommendations.push('Email security configuration is excellent!');
    }

    return recommendations;
}
