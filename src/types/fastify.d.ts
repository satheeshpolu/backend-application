import type { JWTPayload } from './index';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}
