const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schemas/typeDefs');
const resolvers = require('./controllers/userController');
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Servidor corriendo en ${url}`);
});


