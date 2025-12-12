import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.js';
import historyRoutes from './routes/history.js';
import scanRoutes from './routes/scan.js';
import apiKeyRoutes from './routes/apikeys.js';
import webhookRoutes from './routes/webhooks.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { metricsMiddleware } from './middleware/metrics.js';
import { auditMiddleware } from './middleware/audit.js';
import { apiVersion } from './middleware/versioning.js';
import { register } from './metrics.js';
import { initTelemetry } from './telemetry.js';

// Initialize OpenTelemetry
initTelemetry();

export const prisma = new PrismaClient();
const app = express();

// Security Middleware
app.set('trust proxy', 1); // Trust first proxy
app.use(helmet({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
})); // Secure HTTP headers

// Add Permissions-Policy header
app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    next();
});
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(morgan('combined')); // Production logging

// CORS Configuration
// CORS Configuration
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(metricsMiddleware); // Prometheus metrics
app.use(auditMiddleware); // Audit logging
app.use(apiVersion); // API versioning
app.use(rateLimiter); // Global rate limiter

// V1 API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/scan', scanRoutes);
app.use('/api/v1/keys', apiKeyRoutes);
app.use('/api/v1/webhooks', webhookRoutes);

// Legacy routes (for backwards compatibility)
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/keys', apiKeyRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: 'v1.1-no-verify' });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'v1.1-no-verify' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

export default app;
