/**
 * Notes Controller
 * Handles HTTP request/response logic for notes
 */
const notesService = require('./notes.service');
const Note = require('./notes.model');
const { createError } = require('../../middleware/errorHandler');
const { successResponse, createdResponse, paginatedResponse, noContentResponse } = require('../../utils/responseHandler');

/**
 * Get all notes
 * GET /api/v1/notes
 */
const getAll = async (req, res) => {
  const { page, limit, offset } = req.pagination;
  const result = await notesService.findAll({ limit, offset });
  
  if (result.total !== undefined) {
    return paginatedResponse(res, result.data, { page, limit, total: result.total }, "Notes retrieved successfully");
  }
  return successResponse(res, result.data, "Notes retrieved successfully");
};

/**
 * Get note by ID
 * GET /api/v1/notes/:id
 */
const getById = async (req, res) => {
  const note = await notesService.findById(req.validatedNoteId);
  
  if (!note) {
    throw createError.notFound(`Note with ID ${req.validatedNoteId} not found`);
  }
  
  return successResponse(res, note, "Note retrieved successfully");
};

/**
 * Create a new note
 * POST /api/v1/notes
 */
const create = async (req, res) => {
  const note = Note.fromRequest(req.body);
  const created = await notesService.create(note, new Date().toISOString());
  
  return createdResponse(res, created, "Note created successfully");
};

/**
 * Update note by ID
 * PUT /api/v1/notes/:id
 */
const update = async (req, res) => {
  const noteExists = await notesService.exists(req.validatedNoteId);
  
  if (!noteExists) {
    throw createError.notFound(`Note with ID ${req.validatedNoteId} not found`);
  }
  
  const note = Note.fromRequest(req.body);
  const updated = await notesService.update(req.validatedNoteId, note, new Date().toISOString());
  
  return successResponse(res, updated, "Note updated successfully");
};

/**
 * Delete note by ID
 * DELETE /api/v1/notes/:id
 */
const remove = async (req, res) => {
  const noteExists = await notesService.exists(req.validatedNoteId);
  
  if (!noteExists) {
    throw createError.notFound(`Note with ID ${req.validatedNoteId} not found`);
  }
  
  await notesService.remove(req.validatedNoteId);
  return noContentResponse(res);
};

/**
 * Delete all notes
 * DELETE /api/v1/notes
 */
const removeAll = async (req, res) => {
  await notesService.removeAll();
  return noContentResponse(res);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  removeAll,
};
