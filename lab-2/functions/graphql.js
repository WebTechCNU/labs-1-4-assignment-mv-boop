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
    completed: Boolean
  }

  type Query {
    tasks: [Task]
    task(id: ID!): Task
  }

  type Mutation {
    createTask(title: String!, description: String): Task
    updateTask(id: ID!, completed: Boolean): Task
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
    updateTask: async (_, { id, completed }) => {
      const collection = await connectDB();
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { completed } }
      );
      return await collection.findOne({ _id: new ObjectId(id) });
    },
    deleteTask: async (_, { id }) => {
      const collection = await connectDB();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
  },
};

const app = express();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true
});

async function startApolloServer() {
  await server.start();
  // Кажемо Apollo слухати саме ту адресу, яку генерує Netlify
  server.applyMiddleware({ app, path: '/.netlify/functions/graphql' }); 
}

startApolloServer(); 
exports.handler = serverless(app);