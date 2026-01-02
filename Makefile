# Makefile для упрощения работы с Docker

.PHONY: help build up down logs restart clean dev prod migrate seed test

# Цвета для вывода
GREEN  := \033[0;32m
YELLOW := \033[0;33m
NC     := \033[0m # No Color

help: ## Показать эту справку
	@echo "$(GREEN)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

# Production команды
build: ## Собрать Docker образы для production
	@echo "$(GREEN)Сборка production образов...$(NC)"
	docker-compose build

up: ## Запустить приложение в production режиме
	@echo "$(GREEN)Запуск production контейнеров...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Приложение доступно на http://localhost:3000$(NC)"
	@echo "$(GREEN)Adminer доступен на http://localhost:8080$(NC)"

down: ## Остановить все контейнеры
	@echo "$(YELLOW)Остановка контейнеров...$(NC)"
	docker-compose down

logs: ## Показать логи всех контейнеров
	docker-compose logs -f

restart: down up ## Перезапустить все контейнеры

clean: ## Удалить все контейнеры, образы и volumes
	@echo "$(YELLOW)Удаление всех контейнеров и данных...$(NC)"
	docker-compose down -v --rmi all
	@echo "$(GREEN)Очистка завершена!$(NC)"

# Development команды
dev: ## Запустить приложение в режиме разработки с hot-reload
	@echo "$(GREEN)Запуск development контейнеров...$(NC)"
	docker-compose -f docker-compose.dev.yml up
	@echo "$(GREEN)Dev сервер доступен на http://localhost:3000$(NC)"

dev-build: ## Пересобрать и запустить dev окружение
	@echo "$(GREEN)Пересборка development окружения...$(NC)"
	docker-compose -f docker-compose.dev.yml up --build

dev-down: ## Остановить dev контейнеры
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## Показать логи dev контейнеров
	docker-compose -f docker-compose.dev.yml logs -f

# Database команды
migrate: ## Выполнить миграции базы данных
	@echo "$(GREEN)Выполнение миграций...$(NC)"
	docker-compose exec app npm run db:migrate

migrate-dev: ## Выполнить миграции в dev окружении
	@echo "$(GREEN)Выполнение миграций (dev)...$(NC)"
	docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

seed: ## Заполнить базу данных тестовыми данными
	@echo "$(GREEN)Заполнение БД тестовыми данными...$(NC)"
	# docker-compose exec app npm run db:seed

db-studio: ## Открыть Drizzle Studio для управления БД
	@echo "$(GREEN)Запуск Drizzle Studio...$(NC)"
	docker-compose exec app npm run db:studio

# Test команды
test: ## Запустить тесты
	@echo "$(GREEN)Запуск тестов...$(NC)"
	docker-compose exec app npm run test

test-watch: ## Запустить тесты в watch режиме
	docker-compose exec app npm run test:watch

# Utility команды
shell: ## Открыть shell в app контейнере
	docker-compose exec app sh

shell-db: ## Открыть psql в postgres контейнере
	docker-compose exec postgres psql -U nudge_user -d nudge

status: ## Показать статус всех контейнеров
	@echo "$(GREEN)Статус контейнеров:$(NC)"
	docker-compose ps

# Быстрый старт
quickstart: build up migrate ## Быстрый старт: собрать, запустить и мигрировать
	@echo "$(GREEN)✓ Приложение готово к работе!$(NC)"
	@echo "$(GREEN)  - Приложение: http://localhost:3000$(NC)"
	@echo "$(GREEN)  - Adminer: http://localhost:8080$(NC)"
	@echo "$(GREEN)  - БД: localhost:5432$(NC)"

quickstart-dev: dev-build migrate-dev ## Быстрый старт для разработки
	@echo "$(GREEN)✓ Dev окружение готово!$(NC)"
