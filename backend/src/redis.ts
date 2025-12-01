import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://default:poEBLddyIyq4pr2DAFe6zNPGi6wNIvHB@redis-13996.c301.ap-south-1-1.ec2.cloud.redislabs.com:13996';

export const redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required for BullMQ
});

redis.on('error', (err: any) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected');
});
