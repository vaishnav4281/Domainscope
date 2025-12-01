import express from 'express';
import { prisma } from '../app.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Generate a new API Key
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const key = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
        const hashedKey = await bcrypt.hash(key, 10);

        const apiKey = await prisma.apiKey.create({
            data: {
                key: hashedKey, // Store hash
                userId: req.user.userId,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }
        });

        // Return the plain key ONLY ONCE
        res.json({
            id: apiKey.id,
            key: key,
            message: 'Save this key now. You will not be able to see it again.'
        });
    } catch (error) {
        console.error('Create API Key error:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

// List API Keys
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { userId: req.user.userId },
            select: {
                id: true,
                createdAt: true,
                expiresAt: true,
                isActive: true,
                lastUsed: true,
                // Do NOT select 'key' (hash)
            }
        });
        res.json(keys);
    } catch (error) {
        console.error('List API Keys error:', error);
        res.status(500).json({ error: 'Failed to list API keys' });
    }
});

// Revoke API Key
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'ID required' });

        await prisma.apiKey.update({
            where: { id: parseInt(id), userId: req.user.userId },
            data: { isActive: false }
        });
        res.json({ message: 'API Key revoked' });
    } catch (error) {
        console.error('Revoke API Key error:', error);
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});

export default router;
