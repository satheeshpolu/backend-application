const { gql } = require("apollo-server-express");

// Graphql Schema Definations
const typeDefs = gql`
  type User {
    user_id: ID!
    username: String!
    email: String!
  }

  type Query {
    getUser(user_id: ID!): User
    getAllUsers: [User]
  }

  type Mutation {
    createUser(username: String!, email: String!, phone_number: String): User
    updateUser(user_id: String, username: String!, email: String!): User
    deleteUser(user_id: ID!): User
    deleteAllUsers: User
  }
`;

module.exports = typeDefs;
