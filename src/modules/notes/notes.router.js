/**
 * Notes Router
 * Defines routes for notes CRUD operations
 */
const router = require('express').Router();
const notesController = require('./notes.controller');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validateBody, validateNoteId, validatePagination } = require('../../middleware/validator');
const { authenticate } = require('../../middleware/auth');
const { strictRateLimiter } = require('../../middleware/rateLimiter');

// All routes require authentication
router.use(authenticate);

// GET /notes - List all notes (with pagination)
router.get('/',
  validatePagination,
  asyncHandler(notesController.getAll)
);

// GET /notes/:id - Get a single note
router.get('/:id',
  validateNoteId,
  asyncHandler(notesController.getById)
);

// POST /notes - Create a new note
router.post('/',
  validateBody(['note_title', 'note_description']),
  asyncHandler(notesController.create)
);

// PUT /notes/:id - Update a note
router.put('/:id',
  validateNoteId,
  validateBody(['note_title', 'note_description']),
  asyncHandler(notesController.update)
);

// DELETE /notes/:id - Delete a note
router.delete('/:id',
  validateNoteId,
  asyncHandler(notesController.remove)
);

// DELETE /notes - Delete all notes (stricter rate limit)
router.delete('/',
  strictRateLimiter,
  asyncHandler(notesController.removeAll)
);

module.exports = router;
