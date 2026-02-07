/**
 * Application Configuration
 */
import { AppConfig, Environment } from '../types';

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

const env = (process.env.NODE_ENV as Environment) || 'development';
const isProduction = env === 'production';

export const config: AppConfig = {
  env,
  port: getEnvNumber('PORT', 3000),
  host: getEnv('HOST', '0.0.0.0'),

  jwt: {
    secret: isProduction
      ? getEnv('JWT_SECRET')
      : getEnv('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
  },

  database: {
    user: isProduction
      ? getEnv('DB_USER')
      : getEnv('DB_USER', 'sa'),
    password: isProduction
      ? getEnv('DB_PASSWORD')
      : getEnv('DB_PASSWORD', 'password'),
    server: getEnv('DB_SERVER', 'localhost'),
    database: isProduction
      ? getEnv('DB_NAME')
      : getEnv('DB_NAME', 'notes_db'),
    port: getEnvNumber('DB_PORT', 1433),
    options: {
      encrypt: getEnvBoolean('DB_ENCRYPT', true),
      trustServerCertificate: getEnvBoolean('DB_TRUST_SERVER_CERT', !isProduction),
      enableArithAbort: true,
    },
    pool: {
      max: getEnvNumber('DB_POOL_MAX', 10),
      min: getEnvNumber('DB_POOL_MIN', 0),
      idleTimeoutMillis: getEnvNumber('DB_POOL_IDLE_TIMEOUT', 30000),
    },
  },

  rateLimit: {
    max: getEnvNumber('RATE_LIMIT_MAX', 100),
    timeWindow: getEnv('RATE_LIMIT_WINDOW', '1 minute'),
  },

  cors: {
    origins: getEnv('CORS_ORIGINS', '*').split(',').map(s => s.trim()),
  },

  redis: process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : undefined,
};

export default config;
