/**
 * Response Utility Functions
 */
import { FastifyReply } from 'fastify';
import { ApiResponse, PaginatedResponse, Pagination } from '../schemas/common.schema';

export const successResponse = <T>(
  reply: FastifyReply,
  data: T,
  message = 'Success',
  statusCode = 200
): FastifyReply => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  return reply.code(statusCode).send(response);
};

export const errorResponse = (
  reply: FastifyReply,
  message: string,
  statusCode = 400,
  errors?: { field?: string; message: string }[]
): FastifyReply => {
  const response = {
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
  return reply.code(statusCode).send(response);
};

export const paginatedResponse = <T>(
  reply: FastifyReply,
  items: T[],
  total: number,
  pagination: Pagination,
  message = 'Success'
): FastifyReply => {
  const totalPages = Math.ceil(total / pagination.limit);
  
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    },
    timestamp: new Date().toISOString(),
  };
  return reply.code(200).send(response);
};

export const createdResponse = <T>(
  reply: FastifyReply,
  data: T,
  message = 'Created successfully'
): FastifyReply => {
  return successResponse(reply, data, message, 201);
};

export const noContentResponse = (reply: FastifyReply): FastifyReply => {
  return reply.code(204).send();
};
