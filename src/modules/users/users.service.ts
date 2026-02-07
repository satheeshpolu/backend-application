/**
 * Users Service - Business Logic Layer
 */
import bcrypt from 'bcrypt';
import { getPool, sql } from '../../config/database';
import { RegisterUserInput, LoginUserInput, SafeUser, User } from '../../schemas/user.schema';

interface UserRow {
  id: number;
  email: string;
  username: string;
  password: string;
  created_at: Date;
  updated_at: Date | null;
}

const mapUserRow = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  username: row.username,
  password: row.password,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? undefined,
});

const toSafeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

const SALT_ROUNDS = 12;

export const usersService = {
  /**
   * Register a new user
   */
  async register(data: RegisterUserInput): Promise<SafeUser> {
    const pool = await getPool();

    // Check if email already exists
    const existingEmail = await pool
      .request()
      .input('email', sql.NVarChar(255), data.email)
      .query('SELECT id FROM users WHERE email = @email');

    if (existingEmail.recordset.length > 0) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await pool
      .request()
      .input('username', sql.NVarChar(50), data.username)
      .query('SELECT id FROM users WHERE username = @username');

    if (existingUsername.recordset.length > 0) {
      throw new Error('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Insert user
    const result = await pool
      .request()
      .input('email', sql.NVarChar(255), data.email)
      .input('username', sql.NVarChar(50), data.username)
      .input('password', sql.NVarChar(255), hashedPassword).query<UserRow>(`
        INSERT INTO users (email, username, password, created_at)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.username, 
               INSERTED.password, INSERTED.created_at, INSERTED.updated_at
        VALUES (@email, @username, @password, GETDATE())
      `);

    return toSafeUser(mapUserRow(result.recordset[0]));
  },

  /**
   * Login user and return user data (caller handles JWT)
   */
  async login(data: LoginUserInput): Promise<SafeUser | null> {
    const pool = await getPool();

    const result = await pool.request().input('email', sql.NVarChar(255), data.email)
      .query<UserRow>(`
        SELECT id, email, username, password, created_at, updated_at
        FROM users
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const user = mapUserRow(result.recordset[0]);

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return toSafeUser(user);
  },

  /**
   * Get user by ID
   */
  async findById(id: number): Promise<SafeUser | null> {
    const pool = await getPool();

    const result = await pool.request().input('id', sql.Int, id).query<UserRow>(`
        SELECT id, email, username, password, created_at, updated_at
        FROM users
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return toSafeUser(mapUserRow(result.recordset[0]));
  },

  /**
   * Get user by email
   */
  async findByEmail(email: string): Promise<SafeUser | null> {
    const pool = await getPool();

    const result = await pool.request().input('email', sql.NVarChar(255), email).query<UserRow>(`
        SELECT id, email, username, password, created_at, updated_at
        FROM users
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return toSafeUser(mapUserRow(result.recordset[0]));
  },

  /**
   * Update user profile
   */
  async updateProfile(
    id: number,
    data: { email?: string; username?: string }
  ): Promise<SafeUser | null> {
    const pool = await getPool();

    const updates: string[] = [];
    const request = pool.request();
    request.input('id', sql.Int, id);

    if (data.email) {
      // Check if email is taken by another user
      const existing = await pool
        .request()
        .input('email', sql.NVarChar(255), data.email)
        .input('id', sql.Int, id)
        .query('SELECT id FROM users WHERE email = @email AND id != @id');

      if (existing.recordset.length > 0) {
        throw new Error('Email already in use');
      }

      updates.push('email = @email');
      request.input('email', sql.NVarChar(255), data.email);
    }

    if (data.username) {
      // Check if username is taken by another user
      const existing = await pool
        .request()
        .input('username', sql.NVarChar(50), data.username)
        .input('id', sql.Int, id)
        .query('SELECT id FROM users WHERE username = @username AND id != @id');

      if (existing.recordset.length > 0) {
        throw new Error('Username already taken');
      }

      updates.push('username = @username');
      request.input('username', sql.NVarChar(50), data.username);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = GETDATE()');

    const result = await request.query<UserRow>(`
      UPDATE users 
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.username, 
             INSERTED.password, INSERTED.created_at, INSERTED.updated_at
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return toSafeUser(mapUserRow(result.recordset[0]));
  },

  /**
   * Change password
   */
  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const pool = await getPool();

    // Get current password hash
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<UserRow>('SELECT password FROM users WHERE id = @id');

    if (result.recordset.length === 0) {
      return false;
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, result.recordset[0].password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await pool
      .request()
      .input('id', sql.Int, id)
      .input('password', sql.NVarChar(255), hashedPassword)
      .query('UPDATE users SET password = @password, updated_at = GETDATE() WHERE id = @id');

    return true;
  },
};

export default usersService;
