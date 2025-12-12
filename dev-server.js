import express from 'express';
import dns from 'dns/promises';
import cors from 'cors';

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Parser } from 'json2csv';
import dotenv from 'dotenv';
import fs from 'fs';

// Load env_config if it exists
if (fs.existsSync('./env_config')) {
  const envConfig = dotenv.parse(fs.readFileSync('./env_config'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

console.log('DB URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
const prisma = new PrismaClient({});
const app = express();
app.use(cors());
app.use(express.json());


const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-prod';

const ZONES = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'dnsbl.sorbs.net',
  'b.barracudacentral.org',
];



function reverseIp(ip) {
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split('.').reverse().join('.');
  }
  return null;
}

async function checkZone(ip, zone) {
  const rev = reverseIp(ip);
  if (!rev) return { zone, listed: false, text: null };
  const fqdn = `${rev}.${zone}`;
  try {
    await dns.resolve4(fqdn);
    let txt = [];
    try {
      const records = await dns.resolveTxt(fqdn);
      txt = records.flat();
    } catch { }
    return { zone, listed: true, text: txt.join(' ') || null };
  } catch {
    return { zone, listed: false, text: null };
  }
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'User already exists or server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// History Routes
app.post('/api/history', authenticateToken, async (req, res) => {
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

app.get('/api/history', authenticateToken, async (req, res) => {
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

app.get('/api/history/download', authenticateToken, async (req, res) => {
  try {
    const history = await prisma.scanHistory.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    const flattenedHistory = history.map(item => {
      const result = item.result || {};
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

app.delete('/api/history', authenticateToken, async (req, res) => {
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

app.get('/api/dnsbl/check', async (req, res) => {
  try {
    const { ip } = req.query;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ error: 'Missing IP parameter' });
    }
    console.log('🔍 DNSBL check for:', ip);
    const results = await Promise.all(ZONES.map(z => checkZone(ip, z)));
    const listed = results.filter(r => r && r.listed);
    console.log('✅ DNSBL results:', listed.length, 'blacklists');
    res.json({ ip, results, listedCount: listed.length });
  } catch (err) {
    console.error('❌ DNSBL error:', err);
    res.status(500).json({ error: 'DNSBL check failed' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
