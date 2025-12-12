import express from 'express';
import { prisma } from '../app.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { Parser } from 'json2csv';

const router = express.Router();

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { target, result } = req.body;
        const scan = await prisma.scanHistory.create({
            data: {
                userId: req.user.userId,
                target,
                result,
            },
        });
        res.json(scan);
    } catch (error) {
        console.error('Save history error:', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const history = await prisma.scanHistory.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(history);
    } catch (error) {
        console.error('Fetch history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

router.delete('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        await prisma.scanHistory.deleteMany({
            where: { userId: req.user.userId },
        });
        res.json({ message: 'History cleared successfully' });
    } catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

router.get('/download', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const history = await prisma.scanHistory.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
        });

        const flattenedHistory = history.map(item => {
            const result: any = item.result || {};
            return {
                'Domain': item.target,
                'Domain Age': result.domain_age || '-',
                'Created Date': result.created || '-',
                'Expires Date': result.expires || '-',
                'Registrar': result.registrar || '-',
                'IP Address': result.ip_address || '-',
                'Name Servers': Array.isArray(result.name_servers) ? result.name_servers.join('; ') : (result.name_servers || '-'),
                'DNS Records': result.dns_records || '-',
                'Country': result.country || '-',
                'Region': result.region || '-',
                'City': result.city || '-',
                'Latitude': result.latitude || '-',
                'Longitude': result.longitude || '-',
                'ISP': result.isp || '-',
                'VPN/Proxy Detected': result.is_vpn_proxy ? 'Yes' : 'No',
                'Abuse Score': result.abuse_score || 0,
                'Scan Timestamp': new Date(item.createdAt).toLocaleString(),
            };
        });

        const fields = [
            'Domain', 'Domain Age', 'Created Date', 'Expires Date', 'Registrar',
            'IP Address', 'Name Servers', 'DNS Records',
            'Country', 'Region', 'City', 'Latitude', 'Longitude', 'ISP',
            'VPN/Proxy Detected', 'Abuse Score', 'Scan Timestamp'
        ];
        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(flattenedHistory);

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="scan_history.csv"');
        res.send(csv);
    } catch (error) {
        console.error('Download CSV error:', error);
        res.status(500).json({ error: 'Failed to generate CSV' });
    }
});

export default router;
