import type { Request, Response, NextFunction } from 'express';

// API Versioning Middleware
export const apiVersion = (req: Request, res: Response, next: NextFunction) => {
    // Extract version from URL (/api/v1/...) or header (Accept-Version: v1)
    const urlMatch = req.path.match(/^\/api\/v(\d+)\//);
    const urlVersion = urlMatch ? urlMatch[1] : null;
    const headerVersion = req.headers['accept-version']?.toString().replace('v', '');

    const version = urlVersion || headerVersion || '1';

    // Attach version to request for downstream use
    (req as any).apiVersion = version;

    // Add version header to response
    res.setHeader('X-API-Version', `v${version}`);

    // Warn about deprecated versions
    if (version === '0') {
        res.setHeader('X-API-Deprecated', 'true');
        res.setHeader('X-API-Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString());
    }

    next();
};

// Version-specific route wrapper
export function versionedRoute(version: number, handler: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        const requestVersion = parseInt((req as any).apiVersion || '1');

        if (requestVersion === version) {
            return handler(req, res, next);
        }

        next(); // Pass to next version handler
    };
}
