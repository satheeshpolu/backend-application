/**
 * Database Configuration & Connection
 */
import sql from 'mssql';
import config from './index';

let pool: sql.ConnectionPool | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (pool && pool.connected) {
    return pool;
  }

  try {
    pool = await sql.connect({
      user: config.database.user,
      password: config.database.password,
      server: config.database.server,
      database: config.database.database,
      port: config.database.port,
      options: config.database.options,
      pool: config.database.pool,
    });

    pool.on('error', (err: Error) => {
      console.error('Database pool error:', err);
      pool = null;
    });

    console.log('Database connected successfully');
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Database connection closed');
  }
};

export { sql };
export default { getPool, closePool, sql };
