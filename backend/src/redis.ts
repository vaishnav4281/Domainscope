import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('error', (err: any) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected');
});
