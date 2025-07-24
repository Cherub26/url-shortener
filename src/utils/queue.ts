import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { redisConfig } from './redis';

const connection = new Redis({ ...redisConfig, maxRetriesPerRequest: null });

export const clickStatsQueue = new Queue('click-stats', { connection }); 