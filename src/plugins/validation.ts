/**
 * Zod Validation Plugin for Fastify
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

// Validation error formatter
const formatZodErrors = (error: ZodError) => {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
};

// Create validator middleware
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(reply, 'Validation failed', 400, formatZodErrors(error));
      }
      throw error;
    }
  };
};

export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = schema.parse(request.query);
      (request as unknown as { query: T }).query = parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(reply, 'Invalid query parameters', 400, formatZodErrors(error));
      }
      throw error;
    }
  };
};

export const validateParams = <T>(schema: ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = schema.parse(request.params);
      (request as unknown as { params: T }).params = parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        return errorResponse(reply, 'Invalid parameters', 400, formatZodErrors(error));
      }
      throw error;
    }
  };
};

// Plugin to add validation decorators
const zodValidationPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('validateBody', validateBody);
  fastify.decorate('validateQuery', validateQuery);
  fastify.decorate('validateParams', validateParams);
};

export default fp(zodValidationPlugin, {
  name: 'zod-validation',
});
