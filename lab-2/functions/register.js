const connectDB = require("../db");
const bcrypt = require("bcryptjs");

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
        const collection = await connectDB("users"); // Створюємо колекцію users

        // Перевіряємо, чи є вже такий юзер
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "User already exists" }) };
        }

        // Хешуємо пароль (Пункт 4 з методички)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Зберігаємо в базу
        await collection.insertOne({ username, password: hashedPassword });

        return { statusCode: 201, headers, body: JSON.stringify({ message: "User registered successfully" }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};