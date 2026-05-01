Як перевірити лабораторну роботу 2 :
Перейдіть за посиланням в Appolli Sandbox.
Для перевірки отримання даних вставте цей запит і натисніть Run:
query {
  tasks {
    _id
    title
    completed
  }
}

Як перевірити лабораторну роботу 3 :
крок1. Отримання токена 
fetch('/.netlify/functions/login', {
    method: 'POST',
    body: JSON.stringify({ username: "admin", password: "superpassword" })
})
.then(res => res.json())
.then(data => console.log(data));
у відповідь прийде токен 
крок2. Перевірка захисту GraphQL
Якщо в Apollo Sandbox спробувати виконати мутацію видалення без токена:
mutation {
  deleteTask(id: "сюди_вставити_id_будь_якої_таски_з_бази")
}
Сервер поверне помилку безпеки: "Unauthorized: No token provided".
Успішне видалення з токеном :
Відкрити Headers внизу сторінки 
додати новий заголовок key:Authorization ; value: Bearer ВАШ ТОКЕН
Виконайте мутацію знову 
