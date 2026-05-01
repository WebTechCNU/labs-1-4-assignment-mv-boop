const connectDB = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
        const { username, password } = JSON.parse(event.body);
        const collection = await connectDB("users");

        // Шукаємо користувача
        const user = await collection.findOne({ username });
        if (!user) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid credentials" }) };
        }

        // Перевіряємо хеш пароля
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Invalid credentials" }) };
        }

        // Генеруємо токен на 1 годину, як вказано в завданні
        const secretKey = process.env.JWT_SECRET;
        const token = jwt.sign({ userId: user._id, username }, secretKey, { expiresIn: "1h" });

        return { statusCode: 200, headers, body: JSON.stringify({ token }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};