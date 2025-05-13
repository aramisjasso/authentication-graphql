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
    registerUser(email: String!, phone: String!, via: String!): User
    verifyCode(email: String!, code: String!): User
    login(email: String!): String
    updateUser(id: ID!, email: String, phone: String): User
    deleteUser(id: ID!): Boolean
  }
`;

module.exports = typeDefs; 