/**
 * Application Constants
 */
module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    STANDARD_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    STANDARD_MAX_REQUESTS: 100,
    STRICT_MAX_REQUESTS: 10,
  },
  
  // API
  API: {
    VERSION: 'v1',
    PREFIX: '/api/v1',
  },
};
