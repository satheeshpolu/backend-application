/**
 * Fastify Application Factory
 */
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import config from './config';
import authPlugin from './plugins/auth';
import validationPlugin from './plugins/validation';
import redisPlugin from './plugins/redis';
import { errorResponse, successResponse } from './utils/response';

// Import routes
import notesRoutes from './modules/notes/notes.routes';
import usersRoutes from './modules/users/users.routes';

export const buildApp = async (): Promise<FastifyInstance> => {
  const fastify = Fastify({
    logger: {
      level: config.env === 'development' ? 'info' : 'warn',
      transport:
        config.env === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    trustProxy: true,
  });

  // ===========================================
  // Security & Performance Plugins
  // ===========================================

  await fastify.register(helmet, {
    contentSecurityPolicy: config.env === 'production',
  });

  await fastify.register(cors, {
    origin: config.cors.origins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  await fastify.register(compress);

  // Register Redis plugin first (for rate limiting)
  await fastify.register(redisPlugin);

  // Rate limiting with optional Redis store
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    redis: fastify.redis ?? undefined,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      timestamp: new Date().toISOString(),
    }),
  });

  // ===========================================
  // Custom Plugins
  // ===========================================

  await fastify.register(authPlugin);
  await fastify.register(validationPlugin);

  // ===========================================
  // Swagger Documentation
  // ===========================================

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Notes API',
        description: 'Production-ready Notes API with Fastify, TypeScript, and Zod',
        version: '1.0.0',
      },
      servers: [{ url: `http://localhost:${config.port}`, description: 'Development' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // ===========================================
  // Routes
  // ===========================================

  // Health check
  fastify.get('/health', async (request, reply) => {
    const healthData: Record<string, unknown> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };

    if (config.env === 'development') {
      healthData.uptime = process.uptime();
      healthData.environment = config.env;
      healthData.memoryUsage = process.memoryUsage().heapUsed;
      healthData.version = '1.0.0';
    }

    return successResponse(reply, healthData, 'Service is healthy');
  });

  // API routes
  await fastify.register(notesRoutes, { prefix: '/api/v1/notes' });
  await fastify.register(usersRoutes, { prefix: '/api/v1/users' });

  // Test endpoint
  fastify.get('/api/v1/test', async (_request, reply) => {
    return successResponse(reply, { version: '1.0.0' }, 'REST API works fine!');
  });

  // ===========================================
  // Error Handling
  // ===========================================

  fastify.setNotFoundHandler(async (_request, reply) => {
    return errorResponse(reply, 'Route not found', 404);
  });

  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error({
      err: error,
      request: {
        method: request.method,
        url: request.url,
        params: request.params,
        query: request.query,
      },
    });

    // Type guard for error with validation
    const err = error as Error & {
      validation?: Array<{ instancePath?: string; message?: string }>;
      statusCode?: number;
    };

    // Handle validation errors
    if (err.validation && Array.isArray(err.validation)) {
      return errorResponse(
        reply,
        'Validation error',
        400,
        err.validation.map((v) => ({
          field: (v.instancePath ?? '').replace('/', '') || 'body',
          message: v.message ?? 'Invalid value',
        }))
      );
    }

    // Handle known errors
    const statusCode = err.statusCode ?? 500;
    if (statusCode < 500) {
      return errorResponse(reply, err.message, statusCode);
    }

    // Hide internal errors in production
    const message = config.env === 'production' ? 'Internal server error' : err.message;

    return errorResponse(reply, message, 500);
  });

  return fastify;
};

export default buildApp;
