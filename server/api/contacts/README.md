# API Endpoints для управления контактами

## Обзор

Этот модуль предоставляет полный набор CRUD операций для управления контактами пользователя, а также функциональность импорта контактов из Telegram.

## Endpoints

### 1. GET /api/contacts
Получить список всех контактов пользователя.

**Query параметры:**
- `userId` (обязательный) - ID пользователя

**Ответ:**
```json
{
  "success": true,
  "contacts": [
    {
      "id": 1,
      "userId": 1,
      "telegramContactId": "12345",
      "name": "John Doe",
      "username": "johndoe",
      "isTracked": true,
      "frequency": "weekly",
      "customFrequencyDays": null,
      "communicationType": "message",
      "category": "friends",
      "lastContactDate": "2024-01-01T00:00:00.000Z",
      "nextReminderDate": "2024-01-08T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. POST /api/contacts
Добавить новый контакт.

**Тело запроса:**
```json
{
  "userId": 1,
  "telegramContactId": "12345",
  "name": "John Doe",
  "username": "johndoe",
  "isTracked": true,
  "frequency": "weekly",
  "communicationType": "message",
  "category": "friends"
}
```

**Валидация:**
- `frequency`: "weekly" | "monthly" | "quarterly" | "custom"
- `communicationType`: "message" | "call" | "meeting"
- `category`: "family" | "friends" | "colleagues" | "business"
- Для `frequency: "custom"` требуется `customFrequencyDays > 0`

**Ответ:**
```json
{
  "success": true,
  "contact": { /* объект контакта */ }
}
```

### 3. GET /api/contacts/:id
Получить детали конкретного контакта.

**URL параметры:**
- `id` - ID контакта

**Query параметры:**
- `userId` (обязательный) - ID пользователя

**Ответ:**
```json
{
  "success": true,
  "contact": { /* объект контакта */ }
}
```

### 4. PUT /api/contacts/:id
Обновить настройки контакта.

**URL параметры:**
- `id` - ID контакта

**Тело запроса:**
```json
{
  "userId": 1,
  "name": "John Doe Updated",
  "isTracked": true,
  "frequency": "monthly",
  "communicationType": "call",
  "category": "colleagues",
  "lastContactDate": "2024-01-15T00:00:00.000Z"
}
```

**Примечание:** Все поля кроме `userId` опциональны. Обновляются только переданные поля.

**Ответ:**
```json
{
  "success": true,
  "contact": { /* обновленный объект контакта */ }
}
```

### 5. DELETE /api/contacts/:id
Удалить контакт.

**URL параметры:**
- `id` - ID контакта

**Query параметры:**
- `userId` (обязательный) - ID пользователя

**Ответ:**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

### 6. POST /api/contacts/import
Импортировать контакты из Telegram.

**Тело запроса:**
```json
{
  "userId": 1,
  "contacts": [
    {
      "telegramContactId": "12345",
      "name": "John Doe",
      "username": "johndoe",
      "lastContactDate": "2024-01-01T00:00:00.000Z"
    },
    {
      "telegramContactId": "67890",
      "name": "Jane Smith",
      "username": "janesmith"
    }
  ]
}
```

**Особенности:**
- Автоматическая санитизация данных (удаление лишних пробелов)
- Пропуск дубликатов (по `telegramContactId`)
- Установка настроек по умолчанию:
  - `isTracked`: false
  - `frequency`: "monthly"
  - `communicationType`: "message"
  - `category`: "friends"
- Частичный импорт: валидные контакты импортируются, невалидные пропускаются

**Ответ:**
```json
{
  "success": true,
  "imported": 2,
  "skipped": 0,
  "errors": [],
  "contacts": [ /* массив импортированных контактов */ ]
}
```

## Коды ошибок

- `400` - Неверные параметры запроса или валидация не пройдена
- `404` - Контакт не найден
- `500` - Внутренняя ошибка сервера

## Безопасность

Все endpoints проверяют принадлежность контакта пользователю через `userId`. В production версии рекомендуется:
1. Использовать JWT токены вместо передачи `userId` в параметрах
2. Добавить rate limiting
3. Добавить логирование всех операций

## Требования

Реализованные endpoints покрывают следующие требования из спецификации:
- **Требование 1.4**: Импорт и хранение контактов
- **Требование 2.1**: Просмотр списка контактов
- **Требование 2.2**: Настройка отслеживания контактов
- **Требование 2.6**: Сохранение настроек контактов
- **Требование 2.7**: Просмотр деталей контакта
