/**
 * GraphQL Schema Definitions
 */
export const schema = `
  # ==========================================
  # Types
  # ==========================================

  type Note {
    id: ID!
    title: String!
    content: String!
    userId: Int
    createdAt: String!
    updatedAt: String
  }

  type User {
    id: ID!
    user_id: ID!
    email: String!
    username: String!
    createdAt: String!
    updatedAt: String
  }

  type AuthPayload {
    user: User!
    token: String!
  }

  type PaginatedNotes {
    data: [Note!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  # ==========================================
  # Queries
  # ==========================================

  type Query {
    # Notes Queries
    notes(page: Int, limit: Int): PaginatedNotes!
    note(id: ID!): Note
    myNotes(page: Int, limit: Int): PaginatedNotes!

    # User Queries (from old setup)
    getUser(user_id: ID!): User
    getAllUsers: [User]
    
    # Auth Queries
    me: User
  }

  # ==========================================
  # Mutations
  # ==========================================

  type Mutation {
    # Notes Mutations
    createNote(title: String!, content: String!): Note!
    updateNote(id: ID!, title: String, content: String): Note
    deleteNote(id: ID!): Boolean!

    # User Mutations (from old setup)
    createUser(username: String!, email: String!, phone_number: String): User
    updateUser(user_id: ID!, username: String!, email: String!): User
    deleteUser(user_id: ID!): User
    deleteAllUsers: Boolean

    # Auth Mutations
    register(email: String!, username: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
  }
`;
