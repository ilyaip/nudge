# 🐳 Docker Deployment Guide

Полное руководство по запуску Nudge Telegram Mini App в Docker.

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Режимы запуска](#режимы-запуска)
- [Команды Make](#команды-make)
- [Конфигурация](#конфигурация)
- [Troubleshooting](#troubleshooting)

## 🚀 Быстрый старт

### Вариант 1: Production режим

```bash
# 1. Настрой переменные окружения
cp .env.example .env
# Отредактируй .env и добавь свой TELEGRAM_BOT_TOKEN

# 2. Запусти всё одной командой
make quickstart

# Готово! Приложение доступно на:
# - http://localhost:3000 (приложение)
# - http://localhost:8080 (Adminer - управление БД)
```

### Вариант 2: Development режим (с hot-reload)

```bash
# 1. Настрой переменные окружения
cp .env.example .env

# 2. Запусти dev окружение
make dev

# Готово! Dev сервер с hot-reload на http://localhost:3000
```

## 🎯 Режимы запуска

### Production режим

**Что включает:**
- ✅ Оптимизированная сборка Nuxt
- ✅ Многоступенчатый Dockerfile (минимальный размер образа)
- ✅ PostgreSQL 15
- ✅ Adminer для управления БД
- ✅ Healthchecks для мониторинга
- ✅ Автоматический restart при падении

**Команды:**
```bash
# Собрать образы
make build

# Запустить
make up

# Остановить
make down

# Посмотреть логи
make logs

# Перезапустить
make restart
```

### Development режим

**Что включает:**
- ✅ Hot Module Replacement (HMR)
- ✅ Монтирование исходного кода
- ✅ Автоматическая перезагрузка при изменениях
- ✅ PostgreSQL 15
- ✅ Adminer для управления БД

**Команды:**
```bash
# Запустить dev окружение
make dev

# Остановить
make dev-down

# Посмотреть логи
make dev-logs

# Пересобрать и запустить
make dev-build
```

## 📝 Команды Make

Все доступные команды:

```bash
make help              # Показать справку по всем командам

# Production
make build             # Собрать Docker образы
make up                # Запустить контейнеры
make down              # Остановить контейнеры
make logs              # Показать логи
make restart           # Перезапустить
make clean             # Удалить всё (контейнеры, образы, volumes)

# Development
make dev               # Запустить dev режим
make dev-build         # Пересобрать dev окружение
make dev-down          # Остановить dev контейнеры
make dev-logs          # Логи dev контейнеров

# Database
make migrate           # Выполнить миграции (production)
make migrate-dev       # Выполнить миграции (dev)
make db-studio         # Открыть Drizzle Studio
make shell-db          # Открыть psql консоль

# Testing
make test              # Запустить тесты
make test-watch        # Тесты в watch режиме

# Utility
make shell             # Открыть shell в app контейнере
make status            # Показать статус контейнеров

# Быстрый старт
make quickstart        # Всё в одной команде (production)
make quickstart-dev    # Всё в одной команде (dev)
```

## ⚙️ Конфигурация

### Переменные окружения

Создай файл `.env` на основе `.env.example`:

```bash
# Database Configuration
DATABASE_URL=postgresql://nudge_user:nudge_password@postgres:5432/nudge

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_real_bot_token_here
```

### Получение Telegram Bot Token

1. Открой Telegram и найди [@BotFather](https://t.me/BotFather)
2. Отправь команду `/newbot`
3. Следуй инструкциям для создания бота
4. Скопируй полученный токен в `.env`

### Порты

По умолчанию используются следующие порты:

- **3000** - Nuxt приложение
- **5432** - PostgreSQL
- **8080** - Adminer (веб-интерфейс для БД)
- **24678** - Vite HMR (только в dev режиме)

Если порты заняты, измени их в `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "3001:3000"  # Изменить на другой порт
```

## 🗄️ Работа с базой данных

### Adminer (веб-интерфейс)

1. Открой http://localhost:8080
2. Введи данные подключения:
   - **Система:** PostgreSQL
   - **Сервер:** postgres
   - **Пользователь:** nudge_user
   - **Пароль:** nudge_password
   - **База данных:** nudge

### Drizzle Studio

```bash
make db-studio
```

Откроется веб-интерфейс Drizzle Studio для управления БД.

### psql консоль

```bash
make shell-db
```

Прямой доступ к PostgreSQL через psql.

### Миграции

```bash
# Production
make migrate

# Development
make migrate-dev
```

### Backup и Restore

**Создать backup:**
```bash
docker-compose exec postgres pg_dump -U nudge_user nudge > backup.sql
```

**Восстановить из backup:**
```bash
docker-compose exec -T postgres psql -U nudge_user nudge < backup.sql
```

## 🔍 Troubleshooting

### Проблема: Порт уже занят

**Ошибка:**
```
Error: bind: address already in use
```

**Решение:**
```bash
# Найти процесс, использующий порт
lsof -i :3000

# Убить процесс
kill -9 <PID>

# Или изменить порт в docker-compose.yml
```

### Проблема: База данных не подключается

**Решение:**
```bash
# Проверить статус контейнеров
make status

# Проверить логи PostgreSQL
docker-compose logs postgres

# Пересоздать контейнеры
make down
make up
```

### Проблема: Изменения не применяются в dev режиме

**Решение:**
```bash
# Пересобрать dev окружение
make dev-down
make dev-build
```

### Проблема: Нехватка места на диске

**Решение:**
```bash
# Очистить неиспользуемые Docker ресурсы
docker system prune -a --volumes

# Или полная очистка проекта
make clean
```

### Проблема: Ошибка при миграциях

**Решение:**
```bash
# Проверить подключение к БД
make shell-db

# Если БД пустая, выполнить миграции заново
make migrate

# Если нужно сбросить БД
make clean
make quickstart
```

## 📊 Мониторинг

### Логи в реальном времени

```bash
# Все контейнеры
make logs

# Только app
docker-compose logs -f app

# Только postgres
docker-compose logs -f postgres
```

### Статус контейнеров

```bash
make status
```

### Использование ресурсов

```bash
docker stats
```

## 🚢 Production Deployment

### На VPS/Dedicated сервере

```bash
# 1. Клонировать репозиторий
git clone <your-repo-url>
cd nudge-telegram-app

# 2. Настроить .env
cp .env.example .env
nano .env

# 3. Запустить
make quickstart

# 4. Настроить nginx reverse proxy (опционально)
```

### С nginx reverse proxy

Пример конфигурации nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Безопасность

### Рекомендации для production:

1. **Измени пароли БД** в `docker-compose.yml`
2. **Используй secrets** для чувствительных данных
3. **Настрой firewall** для ограничения доступа к портам
4. **Включи HTTPS** через nginx + Let's Encrypt
5. **Регулярно обновляй** Docker образы

### Использование Docker Secrets

```yaml
services:
  app:
    secrets:
      - telegram_bot_token
    environment:
      TELEGRAM_BOT_TOKEN_FILE: /run/secrets/telegram_bot_token

secrets:
  telegram_bot_token:
    file: ./secrets/telegram_bot_token.txt
```

## 📚 Дополнительные ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nuxt 3 Documentation](https://nuxt.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🆘 Поддержка

Если возникли проблемы:

1. Проверь логи: `make logs`
2. Проверь статус: `make status`
3. Попробуй пересоздать: `make clean && make quickstart`
4. Открой issue в репозитории

---

**Приятной разработки! 🚀**
