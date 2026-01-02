# Reminders API

API endpoints для управления напоминаниями о контактах.

## Endpoints

### GET /api/reminders

Получить список сегодняшних напоминаний для пользователя.

**Query параметры:**
- `userId` (required): ID пользователя

**Ответ:**
```json
{
  "success": true,
  "reminders": [
    {
      "id": 1,
      "userId": 1,
      "contactId": 5,
      "dueDate": "2024-01-15T00:00:00.000Z",
      "completed": false,
      "completedAt": null,
      "notificationSent": false,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "contact": {
        "id": 5,
        "userId": 1,
        "telegramContactId": "123456",
        "name": "Иван Иванов",
        "username": "ivan",
        "isTracked": true,
        "frequency": "weekly",
        "customFrequencyDays": null,
        "communicationType": "message",
        "category": "friends",
        "lastContactDate": "2024-01-08T00:00:00.000Z",
        "nextReminderDate": "2024-01-15T00:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-08T00:00:00.000Z"
      }
    }
  ],
  "count": 1
}
```

**Логика:**
1. Получает все отслеживаемые контакты пользователя
2. Определяет контакты, требующие напоминания сегодня (используя `getContactsDueForReminder`)
3. Создает новые напоминания для контактов, у которых их еще нет
4. Возвращает список напоминаний с информацией о контактах

**Коды ошибок:**
- `400`: Отсутствует параметр userId
- `500`: Ошибка сервера при получении напоминаний

---

### POST /api/reminders/:id/complete

Отметить напоминание как выполненное.

**Параметры маршрута:**
- `id` (required): ID напоминания

**Body параметры:**
```json
{
  "userId": 1
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Напоминание успешно выполнено",
  "reminder": {
    "id": 1,
    "userId": 1,
    "contactId": 5,
    "dueDate": "2024-01-15T00:00:00.000Z",
    "completed": true,
    "completedAt": "2024-01-15T14:30:00.000Z",
    "notificationSent": false,
    "createdAt": "2024-01-15T08:00:00.000Z"
  },
  "contact": {
    "id": 5,
    "userId": 1,
    "telegramContactId": "123456",
    "name": "Иван Иванов",
    "username": "ivan",
    "isTracked": true,
    "frequency": "weekly",
    "customFrequencyDays": null,
    "communicationType": "message",
    "category": "friends",
    "lastContactDate": "2024-01-15T14:30:00.000Z",
    "nextReminderDate": "2024-01-22T14:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Логика:**
1. Проверяет, что напоминание существует и принадлежит пользователю
2. Отмечает напоминание как выполненное (completed=true, completedAt=now)
3. Обновляет lastContactDate контакта на текущую дату
4. Рассчитывает и обновляет nextReminderDate контакта
5. Возвращает обновленное напоминание и контакт

**Коды ошибок:**
- `400`: Неверный ID напоминания или отсутствует userId
- `404`: Напоминание или контакт не найдены
- `500`: Ошибка сервера при завершении напоминания

---

## Связанные утилиты

### `server/utils/reminders.ts`

Содержит функции для расчета напоминаний:

- `getFrequencyInDays(frequency, customDays)` - Преобразует частоту в количество дней
- `calculateNextReminderDate(contact)` - Рассчитывает дату следующего напоминания
- `isContactDueForReminder(contact, today)` - Проверяет, требуется ли напоминание сегодня
- `getContactsDueForReminder(contacts, today)` - Фильтрует контакты, требующие напоминания

## Требования

Эти endpoints реализуют следующие требования:

- **3.4**: Отображение виджета с контактами для связи сегодня
- **3.5**: Обновление даты последнего взаимодействия при завершении напоминания
- **3.6**: Удаление контакта из списка сегодняшних напоминаний после завершения

## Примеры использования

### Получить сегодняшние напоминания

```typescript
const response = await fetch('/api/reminders?userId=1')
const data = await response.json()
console.log(`У вас ${data.count} напоминаний на сегодня`)
```

### Отметить напоминание выполненным

```typescript
const response = await fetch('/api/reminders/1/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ userId: 1 })
})
const data = await response.json()
console.log(data.message)
```
