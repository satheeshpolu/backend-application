/**
 * Users Controller
 * Handles HTTP request/response for user operations
 */
const { genSaltSync, hashSync, compareSync } = require('bcrypt');
const { sign } = require('jsonwebtoken');
const usersService = require('./users.service');
const config = require('../../config');
const { successResponse, createdResponse } = require('../../utils/responseHandler');
const { createError } = require('../../middleware/errorHandler');

/**
 * Register a new user
 * POST /api/v1/users
 */
const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  // Check if user exists
  const existingUser = await usersService.findByEmail(email);
  if (existingUser) {
    throw createError.conflict("Email already registered");
  }
  
  // Hash password
  const salt = genSaltSync(10);
  const hashedPassword = hashSync(password, salt);
  
  const user = await usersService.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
  });
  
  return createdResponse(res, user, "User registered successfully");
};

/**
 * Login user
 * POST /api/v1/users/login
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  
  const user = await usersService.findByEmail(email);
  
  if (!user) {
    throw createError.unauthorized("Invalid email or password");
  }
  
  const isValidPassword = compareSync(password, user.password);
  
  if (!isValidPassword) {
    throw createError.unauthorized("Invalid email or password");
  }
  
  // Generate token
  const tokenPayload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
  
  const token = sign(tokenPayload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  
  return successResponse(res, {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    token,
  }, "Login successful");
};

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
const getProfile = async (req, res) => {
  const user = await usersService.findById(req.user.id);
  
  if (!user) {
    throw createError.notFound("User not found");
  }
  
  return successResponse(res, user, "Profile retrieved successfully");
};

module.exports = {
  register,
  login,
  getProfile,
};
