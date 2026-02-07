/**
 * Global Type Definitions
 */
import { FastifyRequest, FastifyReply } from 'fastify';

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

// Authenticated Request
export interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
}

// Environment
export type Environment = 'development' | 'production' | 'test';

// App Configuration
export interface AppConfig {
  env: Environment;
  port: number;
  host: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  database: {
    user: string;
    password: string;
    server: string;
    database: string;
    port: number;
    options: {
      encrypt: boolean;
      trustServerCertificate: boolean;
      enableArithAbort: boolean;
    };
    pool: {
      max: number;
      min: number;
      idleTimeoutMillis: number;
    };
  };
  rateLimit: {
    max: number;
    timeWindow: string;
  };
  cors: {
    origins: string[];
  };
  redis?: {
    url: string;
  };
}

// Database Result
export interface DatabaseResult<T> {
  recordset: T[];
  recordsets: T[][];
  rowsAffected: number[];
}

// Service Response
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Controller Handler Type
export type ControllerHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

// Authenticated Controller Handler
export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => Promise<void>;
