import express from 'express';
import dns from 'node:dns/promises';
import { checkDnsbl } from '../services/dnsbl.js';
import { getWhois } from '../services/whois.js';
import { getWhoisRateLimitStatus } from '../services/whois-queue.js';
import { checkVirusTotal } from '../services/vt.js';
import { checkIPQS } from '../services/ipqs.js';
import { checkAbuseIPDB } from '../services/abuseipdb.js';
import { checkCrtSh } from '../services/crtsh.js';
import { scanQueue } from '../queues/scanQueue.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../app.js';

// New OSINT services
import { getExtendedDNS, getReverseDNS } from '../services/dns-extended.js';
import { checkEmailSecurity } from '../services/email-security.js';
import { analyzeCertificate } from '../services/ssl-analysis.js';
import { analyzeSecurityHeaders } from '../services/http-headers.js';
import { checkGoogleSafeBrowsing } from '../services/google-safe-browsing.js';
import { checkURLScan, searchURLScan } from '../services/urlscan.js';
import { checkAlienVaultOTX } from '../services/alienvault-otx.js';
import { getWaybackSnapshots } from '../services/wayback.js';
import { extractWebsiteMetadata } from '../services/metadata.js';

const router = express.Router();

router.get('/dns', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    try {
        const ips = await dns.resolve4(domain);
        if (ips && ips.length > 0) {
            res.json({ ip: ips[0] });
        } else {
            res.status(404).json({ error: 'No A records found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'DNS resolution failed' });
    }
});

router.get('/dnsbl', async (req, res) => {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ error: 'Missing IP parameter' });
    }
    const result = await checkDnsbl(ip);
    res.json(result);
});

router.get('/whois', async (req, res) => {
    const { domain, force } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await getWhois(domain, force === 'true');
    if (!result) return res.status(404).json({ error: 'WHOIS not found' });
    res.json(result);
});

// WHOIS rate limit status (for monitoring and debugging)
router.get('/whois-status', async (req, res) => {
    const status = await getWhoisRateLimitStatus();
    res.json(status);
});

router.get('/vt', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await checkVirusTotal(domain);
    res.json(result || {});
});

router.get('/ipqs', async (req, res) => {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ error: 'Missing IP parameter' });
    }
    const result = await checkIPQS(ip);
    res.json(result || {});
});

router.get('/abuseipdb', async (req, res) => {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ error: 'Missing IP parameter' });
    }
    const result = await checkAbuseIPDB(ip);
    res.json(result || {});
});

// Subdomain discovery via crt.sh (Certificate Transparency logs)
router.get('/subdomain', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await checkCrtSh(domain);
    res.json(result || {});
});

// ========================================
// NEW OSINT FEATURES
// ========================================

// Extended DNS Records (MX, NS, TXT, AAAA, CNAME, SOA, CAA)
router.get('/dns-extended', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await getExtendedDNS(domain);
    res.json(result);
});

// Reverse DNS (PTR records)
router.get('/reverse-dns', async (req, res) => {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
        return res.status(400).json({ error: 'Missing IP parameter' });
    }
    const result = await getReverseDNS(ip);
    res.json(result);
});

// Email Security (SPF, DKIM, DMARC, BIMI)
router.get('/email-security', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await checkEmailSecurity(domain);
    res.json(result);
});

// SSL/TLS Certificate Analysis
router.get('/ssl-cert', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await analyzeCertificate(domain);
    res.json(result);
});

// HTTP Security Headers
router.get('/http-headers', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await analyzeSecurityHeaders(domain);
    res.json(result);
});

// Google Safe Browsing
router.get('/safe-browsing', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }
    const result = await checkGoogleSafeBrowsing(url);
    res.json(result);
});

// URLScan.io - Scan
router.get('/urlscan', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }
    const result = await checkURLScan(url);
    res.json(result);
});

// URLScan.io - Search
router.get('/urlscan-search', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await searchURLScan(domain);
    res.json(result);
});

// AlienVault OTX
router.get('/alienvault-otx', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await checkAlienVaultOTX(domain);
    res.json(result);
});

// Wayback Machine (Internet Archive)
router.get('/wayback', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    const result = await getWaybackSnapshots(domain);
    res.json(result);
});

// Website Metadata Extraction (Fallback when CORS proxies fail)
router.get('/metadata', async (req, res) => {
    const { domain } = req.query;
    if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Missing domain parameter' });
    }
    try {
        const result = await extractWebsiteMetadata(domain);
        res.json(result);
    } catch (error: any) {
        console.error('[Metadata] Error:', error.message);
        res.status(500).json({ error: 'Failed to extract metadata' });
    }
});

router.post('/full', authenticateToken, async (req: AuthRequest, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: 'Target required' });

    try {
        // Create a placeholder history entry
        const scan = await prisma.scanHistory.create({
            data: {
                userId: req.user.userId,
                target,
                result: { status: 'pending' }
            }
        });

        // Add to queue
        await scanQueue.add('full-scan', {
            target,
            userId: req.user.userId,
            scanId: scan.id
        });

        res.json({ message: 'Scan started', scanId: scan.id });
    } catch (error) {
        console.error('Full scan error:', error);
        res.status(500).json({ error: 'Failed to start scan' });
    }
});

export default router;
