/**
 * GraphQL Resolvers
 */
import { MercuriusContext } from 'mercurius';
import { notesService } from '../modules/notes/notes.service';
import { usersService } from '../modules/users/users.service';
import { getPool, sql } from '../config/database';

interface GraphQLContext extends MercuriusContext {
  user?: {
    userId: number;
    email: string;
  };
}

// Helper to map user rows for GraphQL (includes user_id alias)
interface UserRow {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date | null;
}

const mapUserForGraphQL = (row: UserRow) => ({
  id: row.id,
  user_id: row.id, // Alias for backward compatibility
  username: row.username,
  email: row.email,
  createdAt: row.created_at?.toISOString(),
  updatedAt: row.updated_at?.toISOString(),
});

export const resolvers = {
  Query: {
    // ==========================================
    // Notes Queries
    // ==========================================

    notes: async (
      _: unknown,
      args: { page?: number; limit?: number },
      _context: GraphQLContext
    ) => {
      const page = args.page ?? 1;
      const limit = Math.min(args.limit ?? 10, 100);
      const offset = (page - 1) * limit;

      const result = await notesService.findAll({ page, limit, offset });

      return {
        data: result.notes,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    },

    note: async (_: unknown, args: { id: string }, _context: GraphQLContext) => {
      const id = parseInt(args.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid note ID');
      }
      return notesService.findById(id);
    },

    myNotes: async (
      _: unknown,
      args: { page?: number; limit?: number },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      const page = args.page ?? 1;
      const limit = Math.min(args.limit ?? 10, 100);
      const offset = (page - 1) * limit;

      const result = await notesService.findAll({ page, limit, offset }, context.user.userId);

      return {
        data: result.notes,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      };
    },

    // ==========================================
    // User Queries (from old GraphQL setup)
    // ==========================================

    getUser: async (_: unknown, args: { user_id: string }) => {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('user_id', sql.Int, parseInt(args.user_id, 10))
        .query<UserRow>('SELECT * FROM users WHERE id = @user_id');

      if (result.recordset.length === 0) {
        return null;
      }
      return mapUserForGraphQL(result.recordset[0]);
    },

    getAllUsers: async () => {
      const pool = await getPool();
      const result = await pool.request().query<UserRow>('SELECT * FROM users');

      return result.recordset.map(mapUserForGraphQL);
    },

    // ==========================================
    // Auth Queries
    // ==========================================

    me: async (_: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      const user = await usersService.findById(context.user.userId);
      return user ? { ...user, user_id: user.id } : null;
    },
  },

  Mutation: {
    // ==========================================
    // Notes Mutations
    // ==========================================

    createNote: async (
      _: unknown,
      args: { title: string; content: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      return notesService.create({ title: args.title, content: args.content }, context.user.userId);
    },

    updateNote: async (
      _: unknown,
      args: { id: string; title?: string; content?: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      const id = parseInt(args.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid note ID');
      }
      return notesService.update(
        id,
        { title: args.title, content: args.content },
        context.user.userId
      );
    },

    deleteNote: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      const id = parseInt(args.id, 10);
      if (isNaN(id)) {
        throw new Error('Invalid note ID');
      }
      return notesService.delete(id, context.user.userId);
    },

    // ==========================================
    // User Mutations (from old GraphQL setup)
    // ==========================================

    createUser: async (
      _: unknown,
      args: { username: string; email: string; phone_number?: string }
    ) => {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('username', sql.NVarChar(255), args.username)
        .input('email', sql.NVarChar(255), args.email).query<UserRow>(`
          INSERT INTO users (username, email, created_at)
          OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.created_at, INSERTED.updated_at
          VALUES (@username, @email, GETDATE())
        `);

      return mapUserForGraphQL(result.recordset[0]);
    },

    updateUser: async (_: unknown, args: { user_id: string; username: string; email: string }) => {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('user_id', sql.Int, parseInt(args.user_id, 10))
        .input('username', sql.NVarChar(255), args.username)
        .input('email', sql.NVarChar(255), args.email).query<UserRow>(`
          UPDATE users 
          SET username = @username, email = @email, updated_at = GETDATE()
          OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.created_at, INSERTED.updated_at
          WHERE id = @user_id
        `);

      if (result.recordset.length === 0) {
        throw new Error(`User ${args.user_id} not found`);
      }
      return mapUserForGraphQL(result.recordset[0]);
    },

    deleteUser: async (_: unknown, args: { user_id: string }) => {
      const pool = await getPool();
      const userId = parseInt(args.user_id, 10);

      // Get user before deletion
      const userResult = await pool
        .request()
        .input('user_id', sql.Int, userId)
        .query<UserRow>('SELECT * FROM users WHERE id = @user_id');

      if (userResult.recordset.length === 0) {
        throw new Error(`User ${args.user_id} not found`);
      }

      const user = mapUserForGraphQL(userResult.recordset[0]);

      // Delete the user
      await pool
        .request()
        .input('user_id', sql.Int, userId)
        .query('DELETE FROM users WHERE id = @user_id');

      return user;
    },

    deleteAllUsers: async () => {
      const pool = await getPool();
      await pool.request().query('DELETE FROM users');
      return true;
    },

    // ==========================================
    // Auth Mutations
    // ==========================================

    register: async (
      _: unknown,
      args: { email: string; username: string; password: string },
      context: GraphQLContext
    ) => {
      const user = await usersService.register({
        email: args.email,
        username: args.username,
        password: args.password,
      });

      const token = await context.reply.jwtSign({
        userId: user.id,
        email: user.email,
      });

      return { user: { ...user, user_id: user.id }, token };
    },

    login: async (
      _: unknown,
      args: { email: string; password: string },
      context: GraphQLContext
    ) => {
      const user = await usersService.login({
        email: args.email,
        password: args.password,
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      const token = await context.reply.jwtSign({
        userId: user.id,
        email: user.email,
      });

      return { user: { ...user, user_id: user.id }, token };
    },

    changePassword: async (
      _: unknown,
      args: { currentPassword: string; newPassword: string },
      context: GraphQLContext
    ) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      await usersService.changePassword(
        context.user.userId,
        args.currentPassword,
        args.newPassword
      );
      return true;
    },
  },
};
