const { gql } = require('apollo-server');
const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    phone: String!
    isVerified: Boolean!
  }

  type Query {
    getUsers: [User]
    getUser(id: ID!): User
  }

  type Mutation {
    registerUser(email: String!, phone: String): User
    updateUser(id: ID!, email: String, phone: String): User
    deleteUser(id: ID!): Boolean
  }
`;

module.exports = typeDefs; 