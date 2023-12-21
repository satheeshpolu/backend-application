const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const sql = require("mssql");

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
    console.log(`Server running at http://localhost:${PORT}/graphql`);
  });
};

// Call the startServer function to initiate everything
startServer();
