/**
 * Users Router
 * Defines routes for user operations
 */
const router = require('express').Router();
const usersController = require('./users.controller');
const { asyncHandler } = require('../../middleware/errorHandler');
const { validateBody } = require('../../middleware/validator');
const { authenticate } = require('../../middleware/auth');
const { strictRateLimiter } = require('../../middleware/rateLimiter');

// POST /users - Register new user
router.post('/',
  validateBody(['firstName', 'lastName', 'email', 'password']),
  asyncHandler(usersController.register)
);

// POST /users/login - Login
router.post('/login',
  strictRateLimiter, // Protect against brute force
  validateBody(['email', 'password']),
  asyncHandler(usersController.login)
);

// GET /users/me - Get current user (requires auth)
router.get('/me',
  authenticate,
  asyncHandler(usersController.getProfile)
);

module.exports = router;
