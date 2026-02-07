/**
 * Standardized API response utilities
 */

/**
 * Success response format
 */
const successResponse = (res, data, message = 'Success', statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // Add pagination meta if provided
  if (meta.pagination) {
    response.pagination = meta.pagination;
  }

  // Add any additional meta information
  if (Object.keys(meta).length > 0 && !meta.pagination) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * No content response (204)
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Paginated response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  const { page, limit, total } = pagination;
  
  return successResponse(res, data, message, 200, {
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  });
};

/**
 * Error response format (use errorHandler middleware instead for errors)
 * This is for manual error responses if needed
 */
const errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    error: {
      statusCode,
      message,
      ...(errors && { details: errors }),
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  errorResponse,
};
