const { ApolloServer, gql } = require("apollo-server-lambda");
const { ObjectId } = require("mongodb");
const connectDB = require("../db"); 

const typeDefs = gql`
  type Task {
    _id: ID!
    title: String!
    description: String
    completed: Boolean!
  }

  type Query {
    tasks(skip: Int, take: Int): [Task]
    task(id: ID!): Task
  }

  type Mutation {
    createTask(title: String!, description: String): Task
    updateTask(id: ID!, title: String, description: String, completed: Boolean): Task
    deleteTask(id: ID!): Boolean
  }
`;

const resolvers = {
  Query: {
    tasks: async (_, { skip = 0, take = 10 }) => {
      const collection = await connectDB();
      return await collection.find({}).skip(skip).limit(take).toArray();
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
    updateTask: async (_, { id, ...updateFields }) => {
      const collection = await connectDB();
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateFields }
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

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, 
  playground: true
});

exports.handler = server.createHandler();