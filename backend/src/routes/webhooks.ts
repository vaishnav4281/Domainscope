import express from 'express';
import { prisma } from '../app.js';
import { authenticateToken } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

// Create webhook
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { url, events } = req.body;

        if (!url || !events || !Array.isArray(events)) {
            return res.status(400).json({ error: 'URL and events array required' });
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Generate secret for HMAC
        const secret = crypto.randomBytes(32).toString('hex');

        const webhook = await prisma.webhook.create({
            data: {
                userId: req.user.userId,
                url,
                events,
                secret,
            },
        });

        res.json({
            id: webhook.id,
            url: webhook.url,
            events: webhook.events,
            secret: webhook.secret,
            message: 'Webhook created. Store the secret securely to verify signatures.',
        });
    } catch (error) {
        console.error('Create webhook error:', error);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

// List webhooks (hide secrets)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const webhooks = await prisma.webhook.findMany({
            where: { userId: req.user.userId },
            select: {
                id: true,
                url: true,
                events: true,
                isActive: true,
                createdAt: true,
                lastTriggered: true,
                failureCount: true,
                // Don't return secret
            },
        });
        res.json(webhooks);
    } catch (error) {
        console.error('List webhooks error:', error);
        res.status(500).json({ error: 'Failed to list webhooks' });
    }
});

// Delete webhook
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'ID required' });
        }
        await prisma.webhook.delete({
            where: { id: parseInt(id), userId: req.user.userId },
        });
        res.json({ message: 'Webhook deleted' });
    } catch (error) {
        console.error('Delete webhook error:', error);
        res.status(500).json({ error: 'Failed to delete webhook' });
    }
});

export default router;
