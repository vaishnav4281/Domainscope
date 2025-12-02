import { redis } from '../redis.js';

/**
 * WHOIS Query Queue Manager
 * Prevents exceeding WHOIS server rate limits by throttling queries.
 * 
 * WHOIS Server Limits:
 * - Verisign (.com/.net): ~1 query per second
 * - Most registries: 50-100 queries per day per IP
 */

const WHOIS_RATE_LIMIT_KEY = 'whois:ratelimit';
const MAX_QUERIES_PER_SECOND = 1;
const MAX_QUERIES_PER_DAY = 80; // Conservative limit (below most registry limits)

/**
 * Check if we can make a WHOIS query without exceeding rate limits
 */
export async function canQueryWhois(): Promise<boolean> {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));

    const secondKey = `${WHOIS_RATE_LIMIT_KEY}:sec:${currentSecond}`;
    const dayKey = `${WHOIS_RATE_LIMIT_KEY}:day:${currentDay}`;

    const [secondCount, dayCount] = await Promise.all([
        redis.get(secondKey).then(v => parseInt(v || '0', 10)),
        redis.get(dayKey).then(v => parseInt(v || '0', 10))
    ]);

    return secondCount < MAX_QUERIES_PER_SECOND && dayCount < MAX_QUERIES_PER_DAY;
}

/**
 * Record a WHOIS query (call this after making a query)
 */
export async function recordWhoisQuery(): Promise<void> {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));

    const secondKey = `${WHOIS_RATE_LIMIT_KEY}:sec:${currentSecond}`;
    const dayKey = `${WHOIS_RATE_LIMIT_KEY}:day:${currentDay}`;

    await Promise.all([
        redis.incr(secondKey).then(() => redis.expire(secondKey, 2)), // Expire after 2 seconds
        redis.incr(dayKey).then(() => redis.expire(dayKey, 86400 + 3600)) // Expire after 25 hours
    ]);
}

/**
 * Get current rate limit status for monitoring
 */
export async function getWhoisRateLimitStatus() {
    const now = Date.now();
    const currentSecond = Math.floor(now / 1000);
    const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));

    const secondKey = `${WHOIS_RATE_LIMIT_KEY}:sec:${currentSecond}`;
    const dayKey = `${WHOIS_RATE_LIMIT_KEY}:day:${currentDay}`;

    const [secondCount, dayCount] = await Promise.all([
        redis.get(secondKey).then(v => parseInt(v || '0', 10)),
        redis.get(dayKey).then(v => parseInt(v || '0', 10))
    ]);

    return {
        currentSecond: secondCount,
        maxPerSecond: MAX_QUERIES_PER_SECOND,
        currentDay: dayCount,
        maxPerDay: MAX_QUERIES_PER_DAY,
        canQuery: secondCount < MAX_QUERIES_PER_SECOND && dayCount < MAX_QUERIES_PER_DAY
    };
}

/**
 * Wait until we can make a WHOIS query
 * @param maxWaitMs Maximum time to wait (default: 5000ms)
 * @returns true if can query, false if timeout
 */
export async function waitForWhoisSlot(maxWaitMs = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        if (await canQueryWhois()) {
            return true;
        }
        // Wait 100ms before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
}
