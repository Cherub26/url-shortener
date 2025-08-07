import Redis from 'ioredis';

export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  db: parseInt(process.env.REDIS_DB || '0', 10),
};

const redis = new Redis(redisConfig);

export default redis;
