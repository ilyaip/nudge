import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

// Загружаем переменные окружения из .env файла для тестов
config()

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    // Устанавливаем переменные окружения для тестов
    env: {
      // Для интеграционных тестов используем localhost вместо postgres (имя контейнера)
      DATABASE_URL: 'postgresql://nudge_user:nudge_password@localhost:5432/nudge',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'test_token'
    },
    // Увеличиваем таймауты для property-based и интеграционных тестов
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url))
    }
  }
})
