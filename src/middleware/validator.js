const { createError } = require('./errorHandler');

/**
 * Validate request body against required fields
 */
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    const errors = [];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        missingFields.push(field);
      } else if (typeof req.body[field] === 'string' && req.body[field].trim() === '') {
        errors.push(`${field} cannot be empty`);
      }
    }

    if (missingFields.length > 0) {
      return next(createError.badRequest(`Missing required fields: ${missingFields.join(', ')}`));
    }

    if (errors.length > 0) {
      return next(createError.badRequest(errors.join(', ')));
    }

    next();
  };
};

/**
 * Validate request query parameters
 */
const validateQuery = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = [];

    for (const param of requiredParams) {
      if (!req.query[param]) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      return next(createError.badRequest(`Missing required query parameters: ${missingParams.join(', ')}`));
    }

    next();
  };
};

/**
 * Validate request params
 */
const validateParams = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = [];

    for (const param of requiredParams) {
      if (!req.params[param]) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      return next(createError.badRequest(`Missing required URL parameters: ${missingParams.join(', ')}`));
    }

    next();
  };
};

/**
 * Validate note_id is a valid positive integer
 */
const validateNoteId = (req, res, next) => {
  const noteId = req.params.id || req.body.note_id || req.query.note_id;
  
  if (!noteId) {
    return next(createError.badRequest('Note ID is required'));
  }

  const id = parseInt(noteId, 10);
  if (isNaN(id) || id <= 0) {
    return next(createError.badRequest('Note ID must be a valid positive integer'));
  }

  // Attach validated ID to request
  req.validatedNoteId = id;
  next();
};

/**
 * Sanitize string input to prevent XSS
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Middleware to sanitize all string fields in request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;
  
  // Set defaults
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;

  // Validate ranges
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100; // Max limit to prevent abuse

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
  };

  next();
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validateNoteId,
  sanitizeString,
  sanitizeBody,
  validatePagination,
};
