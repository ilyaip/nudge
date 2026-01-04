# Руководство по деплою

## Деплой на Render.com

### Требования

- Аккаунт на [Render.com](https://render.com)
- Telegram Bot Token
- GitHub репозиторий

### Шаг 1: Подготовка

1. **Создать Telegram бота**
   - Открыть [@BotFather](https://t.me/BotFather) в Telegram
   - Отправить `/newbot`
   - Следовать инструкциям
   - Сохранить Bot Token

2. **Настроить репозиторий**
   - Убедиться, что код в GitHub
   - Проверить наличие `render.yaml` в корне проекта

### Шаг 2: Создание сервисов на Render

#### Вариант A: Автоматический (через render.yaml)

1. Войти в [Render Dashboard](https://dashboard.render.com)
2. Нажать **"New +"** → **"Blueprint"**
3. Подключить GitHub репозиторий
4. Render автоматически создаст:
   - PostgreSQL базу данных
   - Web Service для приложения

#### Вариант B: Ручной

**1. Создать PostgreSQL базу данных:**
- New + → PostgreSQL
- Name: `nudge-db`
- Database: `nudge`
- User: `nudge_user`
- Region: выбрать ближайший
- Plan: Free (или Starter)
- Создать

**2. Создать Web Service:**
- New + → Web Service
- Подключить GitHub репозиторий
- Name: `nudge-app`
- Region: тот же, что и БД
- Branch: `main`
- Runtime: Docker
- Plan: Free (или Starter)

### Шаг 3: Настройка переменных окружения

В настройках Web Service добавить:

```env
DATABASE_URL=<Internal Database URL из PostgreSQL сервиса>
TELEGRAM_BOT_TOKEN=<ваш токен от BotFather>
NODE_ENV=production
ENABLE_SCHEDULER=true
APP_URL=https://your-app.onrender.com
```

**Описание переменных:**

| Переменная | Обязательная | Описание |
|------------|--------------|----------|
| `DATABASE_URL` | Да | URL подключения к PostgreSQL |
| `TELEGRAM_BOT_TOKEN` | Да | Токен бота от @BotFather |
| `NODE_ENV` | Да | Окружение (production) |
| `ENABLE_SCHEDULER` | Нет | Включить планировщик событий (true/false) |
| `APP_URL` | Нет | URL приложения для ссылок в уведомлениях |
| `TELEGRAM_WEBHOOK_SECRET` | Нет | Секрет для верификации webhook |

**Где взять DATABASE_URL:**
1. Открыть PostgreSQL сервис в Render
2. Скопировать **Internal Database URL**
3. Формат: `postgresql://user:password@host/database`

### Шаг 4: Деплой

1. **Автоматический деплой:**
   - Render автоматически деплоит при push в main
   - Следить за логами в Dashboard

2. **Ручной деплой:**
   - Открыть Web Service
   - Нажать **"Manual Deploy"** → **"Deploy latest commit"**

### Шаг 5: Миграции базы данных

После первого деплоя запустить миграции:

1. Открыть Web Service в Render
2. Перейти в **Shell** (в меню слева)
3. Выполнить:
```bash
npm run db:migrate
```

### Шаг 6: Настройка Telegram Webhook

1. **Получить URL приложения:**
   - Формат: `https://nudge-app.onrender.com`

2. **Установить webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://nudge-app.onrender.com/api/webhook"}'
```

3. **Проверить webhook:**
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Шаг 7: Настройка Mini App

1. Открыть [@BotFather](https://t.me/BotFather)
2. Отправить `/mybots`
3. Выбрать вашего бота
4. **Bot Settings** → **Menu Button**
5. **Configure Menu Button**
6. Ввести:
   - URL: `https://nudge-app.onrender.com`
   - Text: `Открыть Nudge`

### Проверка деплоя

1. **Проверить приложение:**
```bash
curl https://nudge-app.onrender.com/api/health
```

2. **Проверить базу данных:**
   - Открыть Shell в Web Service
   - Выполнить: `npm run db:studio`

3. **Проверить бота:**
   - Открыть бота в Telegram
   - Нажать кнопку Menu
   - Должно открыться приложение

## Мониторинг

### Логи

```bash
# В Render Dashboard
Web Service → Logs (в реальном времени)
```

### Метрики

```bash
# В Render Dashboard
Web Service → Metrics
- CPU usage
- Memory usage
- Request count
```

### Алерты

Настроить в Render Dashboard:
- Web Service → Settings → Notifications
- Добавить email или Slack webhook

## Обновление

### Автоматическое

При push в `main` ветку Render автоматически:
1. Собирает новый Docker образ
2. Запускает тесты (если настроены)
3. Деплоит новую версию
4. Выполняет health checks

### Ручное

1. Открыть Web Service
2. **Manual Deploy** → **Deploy latest commit**

### Откат

1. Открыть Web Service
2. **Events** → найти предыдущий успешный деплой
3. **Rollback to this version**

## Масштабирование

### Вертикальное (больше ресурсов)

1. Web Service → Settings
2. Instance Type → выбрать больший план
3. Save Changes

### Горизонтальное (больше инстансов)

1. Web Service → Settings
2. Scaling → увеличить количество инстансов
3. Save Changes

**Примечание:** Для горизонтального масштабирования нужен платный план.

## Backup базы данных

### Автоматический (Render)

Render автоматически создает backup для платных планов PostgreSQL.

### Ручной

```bash
# Экспорт через pg_dump
pg_dump $DATABASE_URL > backup.sql

# Импорт
psql $DATABASE_URL < backup.sql
```

## Troubleshooting

### Приложение не запускается

**Проверить:**
1. Логи в Render Dashboard
2. Переменные окружения установлены
3. База данных доступна
4. Миграции выполнены

### Webhook не работает

**Проверить:**
```bash
# Статус webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Переустановить webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-app.onrender.com/api/webhook"
```

### База данных недоступна

**Проверить:**
1. PostgreSQL сервис запущен
2. DATABASE_URL правильный (Internal URL)
3. Регион БД и приложения совпадают

### Медленная работа

**Причины:**
- Free план "засыпает" после 15 минут неактивности
- Первый запрос после "сна" занимает ~30 секунд

**Решение:**
- Перейти на платный план (Starter $7/мес)
- Настроить cron для периодических запросов

## Стоимость

### Free Plan
- Web Service: Free (засыпает после 15 мин)
- PostgreSQL: Free (90 дней, потом $7/мес)
- Ограничения: 750 часов/месяц

### Starter Plan
- Web Service: $7/месяц
- PostgreSQL: $7/месяц
- Без ограничений по времени работы

### Рекомендация

Для production использовать минимум Starter план для стабильной работы.

## Безопасность

### Переменные окружения

- ✅ Хранятся в Render (не в коде)
- ✅ Не логируются
- ✅ Доступны только приложению

### HTTPS

- ✅ Автоматически настроен Render
- ✅ Бесплатный SSL сертификат
- ✅ Автоматическое обновление

### База данных

- ✅ Приватная сеть (Internal URL)
- ✅ Шифрование в transit
- ✅ Автоматические backup (платный план)

## Дополнительные ресурсы

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
