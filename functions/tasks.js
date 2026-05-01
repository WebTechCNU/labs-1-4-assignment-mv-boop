const connectDB = require("./db");
const { ObjectId } = require("mongodb"); // Додаємо ObjectId для роботи з ID бази даних

exports.handler = async (event) => {
    // Налаштування CORS
    const headers = {
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type" 
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "OK" };
    }

    try {
        const collection = await connectDB();

        // Витягуємо ID з URL (якщо він є). Наприклад, з /.netlify/functions/tasks/12345 ми дістанемо "12345"
        const pathParts = event.path.split('/');
        const idString = pathParts[pathParts.length - 1];
        const taskId = (idString !== 'tasks' && idString !== '') ? idString : null;

        // 1. GET - Отримання списку або одного елемента[cite: 1]
        if (event.httpMethod === "GET") {
            if (taskId) {
                // Отримати одне завдання за ID[cite: 1]
                const task = await collection.findOne({ _id: new ObjectId(taskId) });
                return { statusCode: 200, headers, body: JSON.stringify(task) };
            } else {
                // Отримати всі завдання[cite: 1]
                const tasks = await collection.find({}).toArray();
                return { statusCode: 200, headers, body: JSON.stringify(tasks) };
            }
        }

        // 2. POST - Додавання нового завдання[cite: 1]
        if (event.httpMethod === "POST") {
            const data = JSON.parse(event.body);
            const newTask = {
                title: data.title,
                completed: false,
                createdAt: new Date()
            };
            const result = await collection.insertOne(newTask);
            return { statusCode: 201, headers, body: JSON.stringify({ message: "Task added", id: result.insertedId }) };
        }

        // 3. PUT - Оновлення завдання (наприклад, позначити як виконане)[cite: 1]
        if (event.httpMethod === "PUT") {
            if (!taskId) return { statusCode: 400, headers, body: JSON.stringify({ error: "Не вказано ID завдання" }) };
            
            const data = JSON.parse(event.body);
            const result = await collection.updateOne(
                { _id: new ObjectId(taskId) },
                { $set: data } // Оновлюємо тільки ті поля, які прийшли в запиті
            );
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Task updated", modifiedCount: result.modifiedCount }) };
        }

        // 4. DELETE - Видалення завдання[cite: 1]
        if (event.httpMethod === "DELETE") {
            if (!taskId) return { statusCode: 400, headers, body: JSON.stringify({ error: "Не вказано ID завдання" }) };

            const result = await collection.deleteOne({ _id: new ObjectId(taskId) });
            return { statusCode: 200, headers, body: JSON.stringify({ message: "Task deleted", deletedCount: result.deletedCount }) };
        }

        return { statusCode: 405, headers, body: "Method Not Allowed" };

    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};