# 🚀 Команды для деплоя на Render

Быстрая справка по командам для работы с Render.com

## Git команды

```bash
# Инициализация репозитория
git init
git add .
git commit -m "Initial commit"

# Подключение к GitHub
git remote add origin https://github.com/USERNAME/REPO.git
git branch -M main
git push -u origin main

# Обновление после изменений
git add .
git commit -m "Update feature"
git push origin main
```

## Локальные миграции

```bash
# Установить DATABASE_URL из Render
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Запустить миграции
npm run db:migrate

# Проверить схему
npm run db:studio
```

## Проверка деплоя

```bash
# Health check
curl https://your-app.onrender.com/api/health

# Проверка с подробностями
curl -v https://your-app.onrender.com/api/health

# Проверка времени ответа
time curl https://your-app.onrender.com/api/health
```

## Подключение к БД

```bash
# Через psql (скопируй External Database URL из Render)
psql "postgresql://user:pass@host:5432/db"

# Список таблиц
\dt

# Описание таблицы
\d table_name

# Выход
\q
```

## Полезные SQL запросы

```sql
-- Проверить пользователей
SELECT * FROM users LIMIT 10;

-- Проверить контакты
SELECT * FROM contacts LIMIT 10;

-- Количество записей
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM contacts;

-- Очистить таблицу (осторожно!)
TRUNCATE TABLE contacts CASCADE;
```

## Render CLI (опционально)

```bash
# Установка
npm install -g @render/cli

# Логин
render login

# Список сервисов
render services list

# Логи
render logs -s your-service-id

# Деплой
render deploy -s your-service-id
```

## Telegram Bot команды

```bash
# В BotFather
/mybots
/setdescription
/setabouttext
/setuserpic

# Настройка Menu Button
Bot Settings → Menu Button → Configure menu button
URL: https://your-app.onrender.com
Text: Открыть Nudge
```

## Отладка

```bash
# Проверить DNS
nslookup your-app.onrender.com

# Проверить SSL
openssl s_client -connect your-app.onrender.com:443

# Проверить заголовки
curl -I https://your-app.onrender.com

# Проверить время загрузки
curl -w "@-" -o /dev/null -s https://your-app.onrender.com << 'CURL'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_pretransfer:  %{time_pretransfer}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
CURL
```

## Мониторинг

```bash
# Проверка статуса каждые 30 секунд
watch -n 30 'curl -s https://your-app.onrender.com/api/health | jq'

# Логи в реальном времени (через Render Dashboard)
# Logs → Live Logs
```

## Бэкап базы данных

```bash
# Экспорт (скопируй External Database URL)
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql

# Импорт
psql "postgresql://user:pass@host:5432/db" < backup.sql

# Экспорт только схемы
pg_dump --schema-only "postgresql://..." > schema.sql

# Экспорт только данных
pg_dump --data-only "postgresql://..." > data.sql
```

## Переменные окружения

```bash
# Локально (для тестирования)
export DATABASE_URL="postgresql://..."
export TELEGRAM_BOT_TOKEN="your_token"

# Проверить
echo $DATABASE_URL
echo $TELEGRAM_BOT_TOKEN

# Очистить
unset DATABASE_URL
unset TELEGRAM_BOT_TOKEN
```

## Полезные ссылки

- **Render Dashboard**: https://dashboard.render.com
- **Render Docs**: https://render.com/docs
- **Telegram BotFather**: https://t.me/BotFather
- **GitHub**: https://github.com

---

📚 **Документация:**
- [БЫСТРЫЙ_ДЕПЛОЙ.md](./БЫСТРЫЙ_ДЕПЛОЙ.md)
- [ДЕПЛОЙ_RENDER.md](./ДЕПЛОЙ_RENDER.md)
- [ДЕПЛОЙ_CHECKLIST.md](./ДЕПЛОЙ_CHECKLIST.md)
