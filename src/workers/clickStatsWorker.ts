import { Worker } from 'bullmq';
import Redis from 'ioredis';
import pool from '../db/db';
import { redisConfig } from '../utils/redis';

export function startClickStatsWorker() {
  const connection = new Redis({
    ...redisConfig,
    maxRetriesPerRequest: null // Required by BullMQ
  });

  const worker = new Worker('click-stats', async job => {
    const { urlId, ip, country, city, browser, os, device, userAgent } = job.data;

    await pool.query(
      'UPDATE urls SET click_count = click_count + 1 WHERE id = $1',
      [urlId]
    );

    await pool.query(
      `INSERT INTO click_stats (url_id, ip, country, city, browser, os, device, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [urlId, ip, country, city, browser, os, device, userAgent]
    );
  }, { connection });

  worker.on('completed', job => {
    // console.log(`Click stat logged for job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Failed to log click stat for job ${job?.id}:`, err);
  });

  return worker;
} 