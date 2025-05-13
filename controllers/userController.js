const userModel = require('../models/userModel');

const resolvers = {
  Query: { 
    getUsers: async () => userModel.getAll(),
    getUser: async (_, { id }) => userModel.getById(id), 
  },
  Mutation : {
    registerUser: async (_, { email, phone, via }) => userModel.register(email, phone, via),
    verifyCode: async (_, { email, code }) => userModel.check(email, code),
    login: async (_, { email }) => userModel.login(email),
    updateUser: async (_, { id, email, phone }) => userModel.update(id, email, phone),
    deleteUser: async (_, { id }) => userModel.remove(id)
  }
}

module.exports = resolvers; 