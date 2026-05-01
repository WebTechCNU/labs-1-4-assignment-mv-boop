const { MongoClient } = require("mongodb");
const dns = require("dns");

// Примусово направляємо DNS-запити Node.js до Google (обхід блокування провайдера)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const client = new MongoClient(process.env.MONGO_URI);
let collectionName = "tasks";
let db;

async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db(process.env.DB_NAME);
    }
    return db.collection(collectionName);
}

module.exports = connectDB;