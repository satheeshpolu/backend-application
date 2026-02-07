/**
 * Notes Controller - Request Handlers
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { notesService } from './notes.service';
import {
  CreateNoteInput,
  UpdateNoteInput,
} from '../../schemas/note.schema';
import {
  successResponse,
  createdResponse,
  errorResponse,
  noContentResponse,
  paginatedResponse,
} from '../../utils/response';

export const notesController = {
  /**
   * Get all notes with pagination
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { page?: number; limit?: number };
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const pagination = { page, limit, offset: (page - 1) * limit };
    
    // Get user ID from JWT if authenticated
    const userId = request.user?.userId;

    const { notes, total } = await notesService.findAll(pagination, userId);

    return paginatedResponse(reply, notes, total, pagination, 'Notes retrieved successfully');
  },

  /**
   * Get a single note by ID
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: number };
    const { id } = params;

    const note = await notesService.findById(id);

    if (!note) {
      return errorResponse(reply, 'Note not found', 404);
    }

    return successResponse(reply, note, 'Note retrieved successfully');
  },

  /**
   * Create a new note
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const data = request.body as CreateNoteInput;

    const note = await notesService.create(data, userId);

    return createdResponse(reply, note, 'Note created successfully');
  },

  /**
   * Update an existing note
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: number };
    const { id } = params;
    const userId = request.user!.userId;
    const data = request.body as UpdateNoteInput;

    // Check ownership
    const isOwner = await notesService.isOwner(id, userId);
    if (!isOwner) {
      return errorResponse(reply, 'Note not found or access denied', 404);
    }

    const note = await notesService.update(id, data, userId);

    if (!note) {
      return errorResponse(reply, 'Note not found', 404);
    }

    return successResponse(reply, note, 'Note updated successfully');
  },

  /**
   * Delete a note
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    const params = request.params as { id: number };
    const { id } = params;
    const userId = request.user!.userId;

    // Check ownership
    const isOwner = await notesService.isOwner(id, userId);
    if (!isOwner) {
      return errorResponse(reply, 'Note not found or access denied', 404);
    }

    const deleted = await notesService.delete(id, userId);

    if (!deleted) {
      return errorResponse(reply, 'Note not found', 404);
    }

    return noContentResponse(reply);
  },
};

export default notesController;
