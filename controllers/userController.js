const userModel = require('../models/userModel');

const resolvers = {
  Query: { 
    getUsers: async () => userModel.getAll(),
    getUser: async (_, { id }) => userModel.getById(id), 
  },
  Mutation : {
    createUser: async (_, { name, email }) => userModel.create(name, email),
    updateUser: async (_, { id, name, email }) => userModel.update(id, name, email),
    deleteUser: async (_, { id }) => userModel.remove(id)
  }
}

module.exports = resolvers; 