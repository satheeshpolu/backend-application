/**
 * GraphQL Plugin for Fastify using Mercurius
 */
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import mercurius from 'mercurius';
import { schema } from './schema';
import { resolvers } from './resolvers';

const graphqlPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(mercurius, {
    schema,
    resolvers,
    graphiql: true, // Enable GraphiQL IDE at /graphiql
    path: '/graphql',
    context: async (request, reply) => {
      // Extract user from JWT if present
      let user: { userId: number; email: string } | undefined;

      try {
        await request.jwtVerify();
        user = request.user as { userId: number; email: string };
      } catch {
        // No valid token - user remains undefined
      }

      return { user, reply };
    },
  });

  fastify.log.info('GraphQL endpoint registered at /graphql');
  fastify.log.info('GraphiQL IDE available at /graphiql');
};

export default fp(graphqlPlugin, {
  name: 'graphql',
  dependencies: ['auth'],
});
