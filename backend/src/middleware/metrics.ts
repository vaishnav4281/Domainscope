import type { Request, Response, NextFunction } from 'express';
import { metrics } from '../metrics.js';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Capture response details
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        const route = req.route?.path || req.path;
        const method = req.method;
        const statusCode = res.statusCode.toString();

        // Record metrics
        metrics.httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            duration
        );

        metrics.httpRequestTotal.inc({ method, route, status_code: statusCode });

        // Track errors (4xx and 5xx)
        if (statusCode.startsWith('4') || statusCode.startsWith('5')) {
            const errorType = statusCode.startsWith('4') ? 'client_error' : 'server_error';
            metrics.httpRequestErrors.inc({ method, route, error_type: errorType });
        }
    });

    next();
};
