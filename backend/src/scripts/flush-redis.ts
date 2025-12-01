import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function flush() {
    try {
        console.log('Connected to Redis');
        await redis.flushall();
        console.log('Redis flushed successfully');
    } catch (e) {
        console.error(e);
    } finally {
        await redis.quit();
    }
}

flush();
