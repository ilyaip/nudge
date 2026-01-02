# ✅ Docker Setup Complete!

Твой проект **Nudge Telegram Mini App** теперь полностью упакован в Docker! 🎉

## 📦 Что было создано:

### Docker файлы:
- ✅ `Dockerfile` - Многоступенчатая сборка для production
- ✅ `docker-compose.yml` - Production оркестрация
- ✅ `docker-compose.dev.yml` - Development с hot-reload
- ✅ `.dockerignore` - Оптимизация сборки
- ✅ `docker/init-db.sql` - Инициализация БД

### Утилиты:
- ✅ `Makefile` - Удобные команды для управления
- ✅ `QUICKSTART.md` - Быстрый старт за 3 минуты
- ✅ `README.Docker.md` - Полная документация
- ✅ `server/api/health.get.ts` - Health check endpoint

### Конфигурация:
- ✅ `.env` - Переменные окружения настроены
- ✅ `.gitignore` - Обновлен для Docker

## 🚀 Как запустить:

### Вариант 1: Быстрый старт (рекомендуется)

```bash
make quickstart
```

Эта команда:
1. Соберет Docker образы
2. Запустит PostgreSQL и приложение
3. Выполнит миграции БД
4. Откроет приложение на http://localhost:3000

### Вариант 2: Development режим

```bash
make dev
```

Запустит приложение с hot-reload для разработки.

## 🎯 Что включено:

### Services:
- **Nuxt App** (порт 3000) - Твое приложение
- **PostgreSQL** (порт 5432) - База данных
- **Adminer** (порт 8080) - Веб-интерфейс для БД

### Features:
- ✅ Автоматический restart при падении
- ✅ Health checks для мониторинга
- ✅ Персистентное хранилище данных
- ✅ Оптимизированная сборка (многоступенчатый Dockerfile)
- ✅ Безопасность (непривилегированный пользователь)
- ✅ Hot-reload в dev режиме

## 📝 Полезные команды:

```bash
make help          # Показать все команды
make status        # Статус контейнеров
make logs          # Посмотреть логи
make shell         # Открыть shell в контейнере
make shell-db      # Открыть psql консоль
make migrate       # Выполнить миграции
make test          # Запустить тесты
make down          # Остановить всё
make clean         # Удалить всё (контейнеры + данные)
```

## 🌐 Доступ к сервисам:

После запуска `make quickstart`:

- **Приложение:** http://localhost:3000
  - Dashboard с напоминаниями
  - Список контактов с фильтрами
  - Детали контакта с настройками

- **Adminer (БД):** http://localhost:8080
  - Сервер: `postgres`
  - Пользователь: `nudge_user`
  - Пароль: `nudge_password`
  - База: `nudge`

## 🔧 Настройка Telegram Bot:

1. Открой Telegram и найди [@BotFather](https://t.me/BotFather)
2. Отправь `/newbot` и следуй инструкциям
3. Скопируй полученный токен
4. Обнови `.env`:
   ```bash
   TELEGRAM_BOT_TOKEN=твой_реальный_токен
   ```
5. Перезапусти: `make restart`

## 📚 Документация:

- **Быстрый старт:** [QUICKSTART.md](./QUICKSTART.md)
- **Полная документация:** [README.Docker.md](./README.Docker.md)
- **Основной README:** [README.md](./README.md)

## 🎨 Архитектура:

```
┌─────────────────────────────────────────┐
│         Docker Compose                  │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐   ┌──────────────┐  │
│  │   Nuxt App   │   │  PostgreSQL  │  │
│  │   :3000      │◄──┤   :5432      │  │
│  └──────────────┘   └──────────────┘  │
│         ▲                               │
│         │                               │
│  ┌──────────────┐                      │
│  │   Adminer    │                      │
│  │   :8080      │                      │
│  └──────────────┘                      │
│                                         │
└─────────────────────────────────────────┘
```

## ✨ Следующие шаги:

1. **Запусти проект:**
   ```bash
   make quickstart
   ```

2. **Открой в браузере:**
   - http://localhost:3000

3. **Проверь БД через Adminer:**
   - http://localhost:8080

4. **Начни разработку:**
   ```bash
   make dev
   ```

## 🐛 Troubleshooting:

**Порт занят?**
```bash
# Найти и убить процесс
lsof -i :3000
kill -9 <PID>
```

**Проблемы с БД?**
```bash
make clean
make quickstart
```

**Нужны логи?**
```bash
make logs
```

## 🎉 Готово!

Твой проект полностью готов к запуску в Docker!

Просто выполни:
```bash
make quickstart
```

И наслаждайся! 🚀

---

**Вопросы?** Смотри [README.Docker.md](./README.Docker.md) для подробной документации.
