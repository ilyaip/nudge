# API Планировщика

## Endpoints

### POST /api/scheduler/run

Ручной запуск планировщика напоминаний.

**Использование:**
```bash
curl -X POST http://localhost:3000/api/scheduler/run
```

**Ответ:**
```json
{
  "success": true,
  "message": "Планировщик успешно выполнен",
  "notificationRequestsCount": 3,
  "notificationRequests": [
    {
      "userId": 1,
      "telegramId": "123456789",
      "contactsCount": 2,
      "contacts": [
        {
          "id": 5,
          "name": "Иван Петров",
          "frequency": "weekly"
        }
      ]
    }
  ]
}
```

## Автоматический запуск

Планировщик автоматически запускается каждый день в 9:00 UTC при условии:
- `ENABLE_SCHEDULER=true` в `.env`, или
- `NODE_ENV=production`

## Тестирование

Для тестирования в локальной среде:

1. Добавьте в `.env`:
```env
ENABLE_SCHEDULER=true
TELEGRAM_BOT_TOKEN=your_token
```

2. Запустите сервер:
```bash
npm run dev
```

3. Или используйте ручной запуск через API
