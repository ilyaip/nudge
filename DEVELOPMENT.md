# Руководство по разработке

## Локальная разработка

### Требования

- Docker и Docker Compose
- Node.js 20+
- npm или yarn

### Настройка окружения

1. **Клонировать репозиторий**
```bash
git clone <repository-url>
cd nudge
```

2. **Установить зависимости**
```bash
npm install
```

3. **Настроить переменные окружения**
```bash
cp .env.example .env
```

Отредактировать `.env`:
```env
DATABASE_URL=postgresql://nudge_user:nudge_password@postgres:5432/nudge
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

4. **Запустить Docker контейнеры**
```bash
docker-compose up -d
```

5. **Запустить миграции**
```bash
docker exec nudge-app npm run db:migrate
```

### Режимы запуска

#### Production режим (через Docker)
```bash
docker-compose up -d
# Приложение: http://localhost:3000
# Adminer (БД): http://localhost:8080
```

#### Development режим (локально с hot-reload)
```bash
# Запустить только базу данных
docker-compose up -d postgres

# Обновить DATABASE_URL в .env
DATABASE_URL=postgresql://nudge_user:nudge_password@localhost:5432/nudge

# Запустить dev сервер
npm run dev
```

### Полезные команды

```bash
# Просмотр логов
docker-compose logs -f app

# Перезапуск сервисов
docker-compose restart

# Остановка всех сервисов
docker-compose down

# Полная очистка (включая volumes)
docker-compose down -v

# Доступ к БД через Adminer
open http://localhost:8080
# Server: postgres
# Username: nudge_user
# Password: nudge_password
# Database: nudge
```

## Тестирование

### Подготовка

**ВАЖНО:** Для запуска тестов нужно остановить локальный PostgreSQL, если он установлен:

```bash
# macOS
brew services stop postgresql@15
# или
pkill postgres

# Linux
sudo systemctl stop postgresql
```

Затем запустить Docker PostgreSQL:
```bash
docker-compose up -d postgres
```

### Запуск тестов

```bash
# Все тесты
npm test

# Только unit-тесты
npm test tests/unit

# Только integration-тесты
npm test tests/integration

# Только property-based тесты
npm test tests/properties

# Конкретный файл
npm test tests/unit/api/auth.test.ts

# Watch режим (для разработки)
npm run test:watch
```

### Структура тестов

```
tests/
├── unit/                    # Unit-тесты (118 тестов)
│   ├── api/                # API endpoints
│   ├── pages/              # Страницы
│   └── utils/              # Утилиты
├── integration/            # Integration-тесты (43 теста)
│   ├── user-flow.integration.test.ts
│   ├── gamification-flow.integration.test.ts
│   └── notification-flow.integration.test.ts
└── properties/             # Property-based тесты (3 теста)
    └── persistence.property.test.ts
```

### Отчет о покрытии

```bash
npm test -- --coverage
open coverage/index.html
```

## База данных

### Миграции

```bash
# Создать новую миграцию
npm run db:generate

# Применить миграции
npm run db:migrate

# Открыть Drizzle Studio
npm run db:studio
```

### Прямой доступ к БД

```bash
# Через Docker
docker exec -it nudge-postgres-dev psql -U nudge_user -d nudge

# Через Adminer
open http://localhost:8080
```

## Troubleshooting

### Ошибка: "role 'nudge_user' does not exist"

**Причина:** Локальный PostgreSQL перехватывает порт 5432.

**Решение:**
```bash
# Остановить локальный PostgreSQL
brew services stop postgresql@15  # macOS
sudo systemctl stop postgresql     # Linux

# Проверить, что Docker PostgreSQL работает
docker ps | grep postgres
```

### Ошибка: "Connection refused"

**Причина:** Docker контейнер не запущен.

**Решение:**
```bash
docker-compose up -d postgres
```

### Тесты зависают

**Причина:** База данных недоступна.

**Решение:**
```bash
# Проверить статус
docker ps

# Проверить логи
docker logs nudge-postgres-dev

# Перезапустить
docker-compose restart postgres
```

### Порт 3000 занят

**Решение:**
```bash
# Найти процесс
lsof -i :3000

# Убить процесс
kill -9 <PID>
```

## Стандарты кодирования

### Vue 3 Composition API

**Используйте:**
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)
</script>
```

**Не используйте:**
```vue
<script lang="ts">
export default {
  data() { return { count: 0 } }
}
</script>
```

### Pinia Stores

**Используйте:**
```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  return { user, isAuthenticated }
})
```

**Не используйте:**
```typescript
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null })
})
```

### Комментарии

- Все комментарии на русском языке
- Все сообщения для пользователей на русском
- Названия переменных/функций на английском

## Архитектура

### Backend (Nuxt API Routes)

```
server/
├── api/
│   ├── auth.post.ts              # Аутентификация
│   ├── contacts/                 # CRUD контактов
│   ├── reminders/                # Напоминания
│   ├── gamification/             # Геймификация
│   └── webhook.post.ts           # Telegram webhook
├── db/
│   ├── schema.ts                 # Drizzle схема
│   └── migrations/               # Миграции
└── utils/
    ├── gamification.ts           # Логика XP/уровней
    ├── reminders.ts              # Расчет напоминаний
    └── telegram-bot.ts           # Telegram Bot API
```

### Frontend (Nuxt Pages)

```
pages/
├── index.vue                     # Dashboard
├── contacts.vue                  # Список контактов
├── contacts/[id].vue             # Детали контакта
└── achievements.vue              # Достижения
```

### Composables

```
composables/
├── useTelegramAuth.ts            # Telegram аутентификация
├── useContacts.ts                # Управление контактами
├── useReminders.ts               # Напоминания
└── useGamification.ts            # Геймификация
```

## Дополнительные ресурсы

- [Nuxt 3 Documentation](https://nuxt.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps](https://core.telegram.org/bots/webapps)
