import type { Request, Response, NextFunction } from 'express';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override end function to capture response status
    // @ts-ignore
    res.end = function (chunk: any, encoding: any) {
        const duration = Date.now() - start;
        const status = res.statusCode;

        // Log interesting events (errors, auth, mutations)
        if (status >= 400 || req.method !== 'GET' || req.path.includes('/auth')) {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                type: 'AUDIT_LOG',
                method: req.method,
                path: req.path,
                status: status,
                duration: `${duration}ms`,
                ip: req.ip,
                user: (req as any).user?.id || 'anonymous',
                userAgent: req.get('user-agent')
            }));
        }

        // Call original end
        // @ts-ignore
        originalEnd.apply(res, arguments);
    };

    next();
};
