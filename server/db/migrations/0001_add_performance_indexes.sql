-- Миграция для добавления индексов производительности
-- Создано: 2026-01-02
-- Цель: Оптимизация запросов к базе данных

-- Индексы для таблицы users
-- Ускоряет поиск пользователя по telegram_id (используется при аутентификации)
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Индексы для таблицы contacts
-- Ускоряет получение контактов пользователя
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Ускоряет поиск отслеживаемых контактов
CREATE INDEX IF NOT EXISTS idx_contacts_is_tracked ON contacts(is_tracked);

-- Ускоряет поиск контактов с напоминаниями на сегодня
CREATE INDEX IF NOT EXISTS idx_contacts_next_reminder_date ON contacts(next_reminder_date);

-- Композитный индекс для поиска отслеживаемых контактов пользователя с напоминаниями
CREATE INDEX IF NOT EXISTS idx_contacts_user_tracked_reminder ON contacts(user_id, is_tracked, next_reminder_date);

-- Индексы для таблицы reminders
-- Ускоряет получение напоминаний пользователя
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- Ускоряет поиск активных напоминаний
CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(completed);

-- Ускоряет поиск напоминаний по дате
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date);

-- Композитный индекс для поиска активных напоминаний пользователя
CREATE INDEX IF NOT EXISTS idx_reminders_user_completed ON reminders(user_id, completed);

-- Композитный индекс для поиска неотправленных уведомлений
CREATE INDEX IF NOT EXISTS idx_reminders_notification_sent ON reminders(notification_sent, completed);

-- Индексы для таблицы user_achievements
-- Ускоряет получение достижений пользователя
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Ускоряет проверку разблокированных достижений
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Композитный индекс для проверки уникальности разблокировки
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement ON user_achievements(user_id, achievement_id);

-- Индексы для таблицы activity_logs
-- Ускоряет получение логов активности пользователя
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Ускоряет фильтрацию по типу действия
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- Ускоряет сортировку по дате создания
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Композитный индекс для получения логов пользователя с сортировкой
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- Индексы для таблицы achievements
-- Ускоряет поиск достижения по коду
CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);
