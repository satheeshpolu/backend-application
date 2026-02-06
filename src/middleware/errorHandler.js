/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common HTTP error factory methods
 */
const createError = {
  badRequest: (message = 'Bad Request') => new ApiError(400, message),
  unauthorized: (message = 'Unauthorized') => new ApiError(401, message),
  forbidden: (message = 'Forbidden') => new ApiError(403, message),
  notFound: (message = 'Resource not found') => new ApiError(404, message),
  conflict: (message = 'Conflict') => new ApiError(409, message),
  unprocessableEntity: (message = 'Unprocessable Entity') => new ApiError(422, message),
  internalError: (message = 'Internal Server Error') => new ApiError(500, message, false),
  serviceUnavailable: (message = 'Service Unavailable') => new ApiError(503, message),
};

/**
 * Global error handling middleware
 * Handles both operational and programming errors
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging (use proper logging in production)
  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // SQL Server specific errors
  if (err.code === 'EREQUEST' || err.code === 'ELOGIN') {
    statusCode = 500;
    message = 'Database error occurred';
  }

  // Don't expose internal error details in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      statusCode,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  next(createError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = {
  ApiError,
  createError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
