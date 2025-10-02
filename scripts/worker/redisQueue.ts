import Redis from 'ioredis';
import { createRedisClient } from '../../strapi/config/redis';

export type RedisQueueContext = {
  connection: Redis;
};

export const bootstrapRedisQueue = async (): Promise<RedisQueueContext> => {
  const connection = createRedisClient({ lazyConnect: false });

  await connection.ping();

  return { connection };
};

export const shutdownRedisQueue = async ({ connection }: RedisQueueContext): Promise<void> => {
  await connection.quit();
};

if (require.main === module) {
  bootstrapRedisQueue()
    .then(async (context) => {
      console.info('[redis-queue] Connected to Redis. Add BullMQ workers here.');
      await shutdownRedisQueue(context);
    })
    .catch((error) => {
      console.error('[redis-queue] Failed to bootstrap Redis queue placeholder.', error);
      process.exitCode = 1;
    });
}
