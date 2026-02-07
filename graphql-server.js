const { ApolloServer } = require("apollo-server-express");
const express = require("express");

// Define your GraphQL schema
const typeDefs = require("./src/graph-ql/types");
const Mutation = require("./src/graph-ql/mutations");
const Query = require("./src/graph-ql/queries");

const startServer = async () => {
  const resolvers = {
    Query,
    Mutation,
  };

  // Set up Apollo Server
  const server = new ApolloServer({ typeDefs, resolvers });

  // Start Apollo Server
  await server.start();

  // Create an Express app
  const app = express();

  // Apply Apollo middleware to Express
  server.applyMiddleware({ app });

  const PORT = 6000;

  // Start the server
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
};

// Call the startServer function to initiate everything
startServer();
