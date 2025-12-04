import { redis } from '../redis.js';

/**
 * Wayback Machine (Internet Archive) Integration
 * Completely free, no API key required
 */

export async function getWaybackSnapshots(domain: string) {
    const cacheKey = `wayback:${domain}`;

    // Check cache
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Wayback] Returning cached result for ${domain}`);
            return JSON.parse(cached);
        }
    } catch (err) {
        console.warn('[Wayback] Cache error:', err);
    }

    try {
        const url = `http://${domain}`;

        // Get CDX API data (availability check)
        const cdxResponse = await fetch(
            `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&limit=100&fl=timestamp,original,statuscode,mimetype`
        );

        if (!cdxResponse.ok) {
            return {
                domain,
                available: false,
                error: 'Unable to fetch Wayback Machine data'
            };
        }

        const cdxData = await cdxResponse.json();

        // First row is headers, skip it
        const snapshots = cdxData.slice(1).map((row: any[]) => ({
            timestamp: row[0],
            url: row[1],
            statusCode: row[2],
            mimeType: row[3],
            date: formatWaybackDate(row[0]),
            archiveUrl: `https://web.archive.org/web/${row[0]}/${row[1]}`
        }));

        // Get yearly distribution
        const yearlyStats = calculateYearlyStats(snapshots);

        // Get first and last snapshots
        const firstSnapshot = snapshots[0];
        const lastSnapshot = snapshots[snapshots.length - 1];

        const result = {
            domain,
            available: snapshots.length > 0,
            totalSnapshots: snapshots.length,
            firstSnapshot: firstSnapshot ? {
                date: firstSnapshot.date,
                url: firstSnapshot.archiveUrl,
                timestamp: firstSnapshot.timestamp
            } : null,
            lastSnapshot: lastSnapshot ? {
                date: lastSnapshot.date,
                url: lastSnapshot.archiveUrl,
                timestamp: lastSnapshot.timestamp
            } : null,
            yearlyStats,
            recentSnapshots: snapshots.slice(-10).reverse(), // Last 10, most recent first
            oldestYear: firstSnapshot ? parseInt(firstSnapshot.timestamp.substring(0, 4)) : null,
            latestYear: lastSnapshot ? parseInt(lastSnapshot.timestamp.substring(0, 4)) : null,
            yearsTracked: firstSnapshot && lastSnapshot ?
                parseInt(lastSnapshot.timestamp.substring(0, 4)) - parseInt(firstSnapshot.timestamp.substring(0, 4)) + 1 : 0,
            timestamp: new Date().toISOString()
        };

        // Cache for 24 hours
        await redis.setex(cacheKey, 86400, JSON.stringify(result));
        return result;

    } catch (error: any) {
        return {
            domain,
            available: false,
            error: error.message
        };
    }
}

/**
 * Format Wayback timestamp to human-readable date
 */
function formatWaybackDate(timestamp: string): string {
    // Wayback format: YYYYMMDDhhmmss
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(8, 10);
    const minute = timestamp.substring(10, 12);
    const second = timestamp.substring(12, 14);

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Calculate yearly snapshot statistics
 */
function calculateYearlyStats(snapshots: any[]): Record<string, number> {
    const stats: Record<string, number> = {};

    snapshots.forEach(snapshot => {
        const year = snapshot.timestamp.substring(0, 4);
        stats[year] = (stats[year] || 0) + 1;
    });

    return stats;
}

/**
 * Get specific snapshot URL
 */
export function getSnapshotUrl(url: string, timestamp?: string): string {
    if (timestamp) {
        return `https://web.archive.org/web/${timestamp}/${url}`;
    }
    // Get latest snapshot
    return `https://web.archive.org/web/${url}`;
}
