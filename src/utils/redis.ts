import Redis from 'ioredis';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const db = parseInt(process.env.REDIS_DB || '0', 10);

const parsed = new URL(redisUrl);

export const redisConfig = {
  host: parsed.hostname,
  port: Number(parsed.port || 6379),
  password: parsed.password || undefined,
  db,
};

const redis = new Redis({
  ...redisConfig,
});

export default redis;
