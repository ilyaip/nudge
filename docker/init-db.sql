-- Скрипт инициализации базы данных
-- Выполняется автоматически при первом запуске PostgreSQL контейнера

-- Создаем расширения (если нужны)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Устанавливаем timezone
SET timezone = 'UTC';

-- Создаем схему (если нужна)
-- CREATE SCHEMA IF NOT EXISTS nudge;

-- Логируем успешную инициализацию
DO $$
BEGIN
  RAISE NOTICE 'База данных Nudge успешно инициализирована!';
END $$;
