/**
 * Notes Routes
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { notesController } from './notes.controller';
import {
  createNoteSchema,
  updateNoteSchema,
} from '../../schemas/note.schema';
import { errorResponse } from '../../utils/response';

// Simple validators
const validateNoteId = async (request: FastifyRequest, reply: FastifyReply) => {
  const params = request.params as { id?: string };
  const id = parseInt(params.id ?? '', 10);
  if (isNaN(id) || id < 1) {
    return errorResponse(reply, 'Invalid note ID', 400);
  }
  (request.params as { id: number }).id = id;
};

const validatePagination = async (request: FastifyRequest, _reply: FastifyReply) => {
  const query = request.query as { page?: string; limit?: string };
  const page = parseInt(query.page ?? '1', 10) || 1;
  const limit = Math.min(parseInt(query.limit ?? '10', 10) || 10, 100);
  (request.query as { page: number; limit: number }).page = page;
  (request.query as { page: number; limit: number }).limit = limit;
};

const validateCreateNote = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = createNoteSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
    return errorResponse(reply, 'Validation failed', 400, errors);
  }
  request.body = result.data;
};

const validateUpdateNote = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = updateNoteSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
    return errorResponse(reply, 'Validation failed', 400, errors);
  }
  request.body = result.data;
};

const notesRoutes: FastifyPluginAsync = async (fastify) => {
  // List all notes (authenticated users see their notes, others see all)
  fastify.get(
    '/',
    {
      preHandler: [
        fastify.optionalAuth,
        validatePagination,
      ],
      schema: {
        tags: ['Notes'],
        summary: 'Get all notes',
        description: 'Retrieve paginated list of notes. Authenticated users see their own notes.',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string', default: '1' },
            limit: { type: 'string', default: '10' },
          },
        },
      },
    },
    notesController.list
  );

  // Get single note
  fastify.get(
    '/:id',
    {
      preHandler: [validateNoteId],
      schema: {
        tags: ['Notes'],
        summary: 'Get note by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    notesController.getById
  );

  // Create note (requires auth)
  fastify.post(
    '/',
    {
      preHandler: [
        fastify.authenticate,
        validateCreateNote,
      ],
      schema: {
        tags: ['Notes'],
        summary: 'Create a new note',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            content: { type: 'string', minLength: 1 },
          },
          required: ['title', 'content'],
        },
      },
    },
    notesController.create
  );

  // Update note (requires auth + ownership)
  fastify.put(
    '/:id',
    {
      preHandler: [
        fastify.authenticate,
        validateNoteId,
        validateUpdateNote,
      ],
      schema: {
        tags: ['Notes'],
        summary: 'Update a note',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 255 },
            content: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    notesController.update
  );

  // Patch note (partial update)
  fastify.patch(
    '/:id',
    {
      preHandler: [
        fastify.authenticate,
        validateNoteId,
        validateUpdateNote,
      ],
      schema: {
        tags: ['Notes'],
        summary: 'Partially update a note',
        security: [{ bearerAuth: [] }],
      },
    },
    notesController.update
  );

  // Delete note (requires auth + ownership)
  fastify.delete(
    '/:id',
    {
      preHandler: [
        fastify.authenticate,
        validateNoteId,
      ],
      schema: {
        tags: ['Notes'],
        summary: 'Delete a note',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    notesController.delete
  );
};

export default notesRoutes;
