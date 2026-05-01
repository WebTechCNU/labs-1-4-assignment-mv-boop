const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const serverless = require("serverless-http");
const { ObjectId } = require("mongodb");
const connectDB = require("../db");
const jwt = require("jsonwebtoken");

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
    deleteTask: async (_, { id }, context) => {
      if (!context.user) {
        throw new Error("Unauthorized: No token provided or Invalid token");
      }
      
      const collection = await connectDB();
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
  },
};

const app = express();

app.use((req, res, next) => {
  req.url = '/graphql';
  next();
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: true,
  context: ({ req }) => {
    // Дістаємо токен: event.headers.authorization?.split(" ")[1]
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const secretKey = process.env.JWT_SECRET;
        const user = jwt.verify(token, secretKey);
        return { user }; // Якщо токен валідний, кладемо юзера в контекст
      } catch (error) {
        console.error("Invalid token");
      }
    }
    return {}; // Якщо токена немає або він кривий, повертаємо порожній контекст
  }
});

let graphqlHandler;

async function setupApollo() {
  await server.start();
  // Використовуємо зірочку: хай Apollo ловить ВСІ шляхи, так Netlify його не заплутає
  server.applyMiddleware({ app, path: '*' });
}

exports.handler = async (event, context) => {
  // МАГІЧНИЙ РЯДОК ПРОТИ 503 ПОМИЛКИ:
  // Кажемо лямбда-функції не чекати фонових з'єднань MongoDB
  context.callbackWaitsForEmptyEventLoop = false;

  if (!graphqlHandler) {
    await setupApollo();
    graphqlHandler = serverless(app);
  }
  
  return graphqlHandler(event, context);
};