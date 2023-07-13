const express = require('express');
const { ApolloServer } = require('apollo-server-express');
require('dotenv').config();
require('colors');
const cookieParser = require('cookie-parser');

const { typeDefs, resolvers } = require('./schema/schema');

const app = express();

app.use(express.json());
app.use(cookieParser());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers.authorization;
    return { token };
  },
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app });

  const port = 3000;
  app.listen(port, () => {
    console.log(
      `Server running at http://localhost:${port}${server.graphqlPath}`
    );
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
});
