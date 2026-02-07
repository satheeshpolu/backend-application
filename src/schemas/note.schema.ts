/**
 * Zod Schemas for Notes Module
 */
import { z } from 'zod';

// Base note schema
export const noteSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(10000),
  userId: z.number().int().positive(),
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()).optional(),
});

// Create note schema (without id, timestamps)
export const createNoteSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Content cannot be empty')
    .max(10000, 'Content must be less than 10000 characters')
    .trim(),
});

// Update note schema (all fields optional)
export const updateNoteSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(255, 'Title must be less than 255 characters')
      .trim()
      .optional(),
    content: z
      .string()
      .min(1, 'Content cannot be empty')
      .max(10000, 'Content must be less than 10000 characters')
      .trim()
      .optional(),
  })
  .refine((data) => data.title || data.content, {
    message: 'At least one field (title or content) must be provided',
  });

// Note ID parameter schema
export const noteIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a number')
    .transform(Number)
    .pipe(z.number().int().positive('ID must be a positive integer')),
});

// Pagination query schema
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().int().min(1).default(1)),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().int().min(1).max(100).default(10)),
});

// Types derived from schemas
export type Note = z.infer<typeof noteSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type NoteIdParam = z.infer<typeof noteIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
