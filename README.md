# Nudge Telegram Mini App

A Telegram Mini App that helps users maintain important social and professional connections through intelligent reminders and gamification.

## 🚀 Быстрый старт с Docker

**Самый простой способ запустить проект:**

```bash
# 1. Настрой .env
cp .env.example .env
# Добавь свой TELEGRAM_BOT_TOKEN

# 2. Запусти всё одной командой
make quickstart
```

**Готово!** Приложение доступно на http://localhost:3000

📚 **Подробная документация:** [QUICKSTART.md](./QUICKSTART.md) | [README.Docker.md](./README.Docker.md)

---

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript, UnoCSS
- **State Management**: Pinia
- **Backend**: Nuxt API Routes (Nitro)
- **Database**: PostgreSQL with Drizzle ORM
- **Testing**: Vitest, fast-check (property-based testing)
- **Scheduling**: node-cron
- **Integration**: Telegram Bot API, Telegram Web App SDK
- **Deployment**: Docker, Docker Compose

## Setup (без Docker)

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Telegram Bot Token (from @BotFather)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: Your PostgreSQL connection string
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token

3. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

4. Start development server:
```bash
npm run dev
```

## 🐳 Docker Commands

```bash
make help              # Показать все команды
make quickstart        # Быстрый старт (production)
make dev               # Режим разработки с hot-reload
make logs              # Посмотреть логи
make status            # Статус контейнеров
make clean             # Удалить всё
```

## Database Management

- **Generate migrations**: `npm run db:generate`
- **Run migrations**: `npm run db:migrate`
- **Open Drizzle Studio**: `npm run db:studio`

## Testing

- **Run tests**: `npm test`
- **Watch mode**: `npm run test:watch`

## Project Structure

```
├── server/
│   ├── db/
│   │   ├── schema.ts          # Database schema
│   │   ├── index.ts           # Database connection
│   │   ├── migrate.ts         # Migration script
│   │   └── migrations/        # Generated migrations
│   └── api/                   # API routes
├── pages/                     # Nuxt pages (file-based routing)
│   ├── index.vue              # Dashboard
│   ├── contacts.vue           # Contacts list
│   └── contacts/[id].vue      # Contact details
├── components/                # Vue components
├── composables/               # Vue composables
│   ├── useContacts.ts         # Contact management
│   ├── useReminders.ts        # Reminder management
│   └── useGamification.ts     # Gamification logic
├── stores/                    # Pinia stores
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   └── properties/            # Property-based tests
├── docker/                    # Docker configuration
├── Dockerfile                 # Production Docker image
├── docker-compose.yml         # Production orchestration
├── docker-compose.dev.yml     # Development orchestration
├── Makefile                   # Convenient commands
└── app.vue                    # Root component
```

## Development

This project follows the spec-driven development approach. See `.kiro/specs/nudge-telegram-app/` for:
- `requirements.md` - Feature requirements
- `design.md` - System design and architecture
- `tasks.md` - Implementation task list

## 🌐 Деплой в Production

### Render.com (Рекомендуется)

**Быстрый деплой за 10 минут:**

📚 **Инструкции:**
- [БЫСТРЫЙ_ДЕПЛОЙ.md](./БЫСТРЫЙ_ДЕПЛОЙ.md) - Краткая инструкция
- [ДЕПЛОЙ_RENDER.md](./ДЕПЛОЙ_RENDER.md) - Подробное руководство

**Что включено:**
- ✅ Автоматический деплой из GitHub
- ✅ Managed PostgreSQL база данных
- ✅ Бесплатный HTTPS
- ✅ Готовая конфигурация (`render.yaml`)

**Бесплатный тариф:**
- Web Service с ограничениями (холодный старт)
- PostgreSQL 90 дней бесплатно
- Идеально для тестирования в Telegram

### Альтернативы

- **Vercel**: Отлично для Nuxt, но нужна внешняя БД
- **Railway**: Поддержка Docker + PostgreSQL ($5/мес)
- **Fly.io**: Глобальное распределение, Docker

## License

Private project
