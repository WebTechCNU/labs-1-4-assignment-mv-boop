const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const serverless = require("serverless-http");
const { ObjectId } = require("mongodb");
const connectDB = require("../db");

// Схема
const typeDefs = gql`
  type Task {
    _id: ID!
    title: String!
    description: String
    completed: Boolean!
  }

  type Query {
    tasks: [Task]
    task(id: ID!): Task
  }

  type Mutation {
    createTask(title: String!, description: String): Task
    deleteTask(id: ID!): Boolean
  }
`;

// Резолвери
const resolvers = {
  Query: {
    tasks: async () => {
      const collection = await connectDB();
      return await collection.find({}).toArray();
    },
    task: async (_, { id }) => {
      const collection = await connectDB();
      return await collection.findOne({ _id: new ObjectId(id) });
    },
  },
  Mutation: {
    createTask: async (_, { title, description }) => {
      const collection = await connectDB();
      const newTask = { title, description, completed: false };
      const result = await collection.insertOne(newTask);
      return { ...newTask, _id: result.insertedId };
    },
    deleteTask: async (_, { id }) => {
      const collection = await connectDB();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
  },
};

// Налаштування сервера через Express (як у методичці)
const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true
});

async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' }); 
}

startApolloServer(); 

exports.handler = serverless(app);