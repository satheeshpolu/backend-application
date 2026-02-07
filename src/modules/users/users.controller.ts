/**
 * Users Controller - Request Handlers
 */
import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service';
import {
  RegisterUserInput,
  LoginUserInput,
  UpdateUserInput,
  ChangePasswordInput,
} from '../../schemas/user.schema';
import {
  successResponse,
  createdResponse,
  errorResponse,
} from '../../utils/response';

export const usersController = {
  /**
   * Register a new user
   */
  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as RegisterUserInput;
      const user = await usersService.register(body);

      // Generate JWT token
      const token = await reply.jwtSign({
        userId: user.id,
        email: user.email,
      });

      return await createdResponse(reply, { user, token }, 'Registration successful');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already')) {
          return errorResponse(reply, error.message, 409);
        }
      }
      throw error;
    }
  },

  /**
   * Login user
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as LoginUserInput;
    const user = await usersService.login(body);

    if (!user) {
      return errorResponse(reply, 'Invalid email or password', 401);
    }

    // Generate JWT token
    const token = await reply.jwtSign({
      userId: user.id,
      email: user.email,
    });

    return successResponse(reply, { user, token }, 'Login successful');
  },

  /**
   * Get current user profile
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    const user = await usersService.findById(userId);

    if (!user) {
      return errorResponse(reply, 'User not found', 404);
    }

    return successResponse(reply, user, 'Profile retrieved successfully');
  },

  /**
   * Update user profile
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = request.body as UpdateUserInput;

    try {
      const user = await usersService.updateProfile(userId, body);

      if (!user) {
        return await errorResponse(reply, 'User not found', 404);
      }

      return await successResponse(reply, user, 'Profile updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already')) {
          return errorResponse(reply, error.message, 409);
        }
      }
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = request.body as ChangePasswordInput;
    const { currentPassword, newPassword } = body;

    try {
      await usersService.changePassword(userId, currentPassword, newPassword);

      return await successResponse(reply, null, 'Password changed successfully');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('incorrect')) {
          return errorResponse(reply, error.message, 400);
        }
      }
      throw error;
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;

    const user = await usersService.findById(userId);

    if (!user) {
      return errorResponse(reply, 'User not found', 404);
    }

    // Generate new JWT token
    const token = await reply.jwtSign({
      userId: user.id,
      email: user.email,
    });

    return successResponse(reply, { token }, 'Token refreshed successfully');
  },
};

export default usersController;
