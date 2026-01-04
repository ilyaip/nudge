# Многоступенчатая сборка для оптимизации размера образа

# Этап 1: Установка зависимостей
FROM node:20-alpine AS deps
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production && \
    npm cache clean --force

# Этап 2: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем все зависимости (включая dev)
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Nuxt файлы
RUN npm run postinstall

# Собираем приложение для production
RUN npm run build

# Этап 3: Production образ
FROM node:20-alpine AS runner
WORKDIR /app

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

# Копируем зависимости из deps
COPY --from=deps --chown=nuxtjs:nodejs /app/node_modules ./node_modules

# Копируем собранное приложение из builder
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package*.json ./

# Копируем миграции для автоматического применения при старте
COPY --from=builder --chown=nuxtjs:nodejs /app/server/db/migrations ./server/db/migrations

# Переключаемся на непривилегированного пользователя
USER nuxtjs

# Открываем порт
EXPOSE 3000

# Healthcheck для проверки работоспособности
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запускаем приложение
CMD ["node", ".output/server/index.mjs"]
