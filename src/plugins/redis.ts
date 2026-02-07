/**
 * Redis Client Plugin for Fastify
 * Provides Redis connection for distributed rate limiting and caching
 */
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { createClient, RedisClientType } from 'redis';
import config from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    redis: RedisClientType | null;
  }
}

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redisUrl = config.redis?.url;

  // If no Redis URL, skip Redis connection (use in-memory rate limiting)
  if (!redisUrl) {
    fastify.log.info('Redis URL not configured - using in-memory rate limiting');
    fastify.decorate('redis', null);
    return;
  }

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            fastify.log.error('Redis max reconnection attempts reached');
            return new Error('Redis max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err) => {
      fastify.log.error({ err }, 'Redis client error');
    });

    client.on('connect', () => {
      fastify.log.info('Redis client connected');
    });

    client.on('ready', () => {
      fastify.log.info('Redis client ready');
    });

    client.on('reconnecting', () => {
      fastify.log.warn('Redis client reconnecting');
    });

    await client.connect();

    fastify.decorate('redis', client as RedisClientType);

    // Graceful shutdown
    fastify.addHook('onClose', async () => {
      if (client.isOpen) {
        await client.quit();
        fastify.log.info('Redis client disconnected');
      }
    });
  } catch (error) {
    fastify.log.error(
      { error },
      'Failed to connect to Redis - falling back to in-memory rate limiting'
    );
    fastify.decorate('redis', null);
  }
};

export default fp(redisPlugin, {
  name: 'redis',
  dependencies: [],
});
