/**
 * Common Zod Schemas
 */
import { z } from 'zod';

// Standard API response schema
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional(),
    timestamp: z.string().datetime(),
  });

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z
    .array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
      })
    )
    .optional(),
  timestamp: z.string().datetime(),
});

// Paginated response schema
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    }),
    timestamp: z.string().datetime(),
  });

// Health check response schema
export const healthResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: z.string().datetime(),
    uptime: z.number().optional(),
    environment: z.string().optional(),
    version: z.string().optional(),
    memoryUsage: z.number().optional(),
  }),
  timestamp: z.string().datetime(),
});

// Types
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
};

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  timestamp: string;
};

export type Pagination = {
  page: number;
  limit: number;
  offset: number;
};
