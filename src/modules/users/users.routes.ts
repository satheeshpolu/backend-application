/**
 * Users Routes
 */
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { usersController } from './users.controller';
import {
  registerUserSchema,
  loginUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from '../../schemas/user.schema';
import { errorResponse } from '../../utils/response';

// Validators
const validateRegister = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = registerUserSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return errorResponse(reply, 'Validation failed', 400, errors);
  }
  request.body = result.data;
};

const validateLogin = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = loginUserSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return errorResponse(reply, 'Validation failed', 400, errors);
  }
  request.body = result.data;
};

const validateUpdateProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = updateUserSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return errorResponse(reply, 'Validation failed', 400, errors);
  }
  request.body = result.data;
};

const validateChangePassword = async (request: FastifyRequest, reply: FastifyReply) => {
  const result = changePasswordSchema.safeParse(request.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return errorResponse(reply, 'Validation failed', 400, errors);
  }
  request.body = result.data;
};

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // Register
  fastify.post(
    '/register',
    {
      preHandler: [validateRegister],
      schema: {
        tags: ['Users'],
        summary: 'Register a new user',
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 3, maxLength: 50 },
            password: { type: 'string', minLength: 8 },
          },
          required: ['email', 'username', 'password'],
        },
      },
    },
    usersController.register
  );

  // Login
  fastify.post(
    '/login',
    {
      preHandler: [validateLogin],
      schema: {
        tags: ['Users'],
        summary: 'Login user',
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        },
      },
    },
    usersController.login
  );

  // Get profile (requires auth)
  fastify.get(
    '/profile',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
      },
    },
    usersController.getProfile
  );

  // Update profile (requires auth)
  fastify.put(
    '/profile',
    {
      preHandler: [fastify.authenticate, validateUpdateProfile],
      schema: {
        tags: ['Users'],
        summary: 'Update user profile',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 3, maxLength: 50 },
          },
        },
      },
    },
    usersController.updateProfile
  );

  // Change password (requires auth)
  fastify.post(
    '/change-password',
    {
      preHandler: [fastify.authenticate, validateChangePassword],
      schema: {
        tags: ['Users'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
            confirmPassword: { type: 'string' },
          },
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
        },
      },
    },
    usersController.changePassword
  );

  // Refresh token (requires auth)
  fastify.post(
    '/refresh-token',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Users'],
        summary: 'Refresh JWT token',
        security: [{ bearerAuth: [] }],
      },
    },
    usersController.refreshToken
  );
};

export default usersRoutes;
