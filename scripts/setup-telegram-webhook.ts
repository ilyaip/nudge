/**
 * Скрипт для установки Telegram webhook
 * 
 * Использование:
 * npx tsx scripts/setup-telegram-webhook.ts
 */

import { config } from 'dotenv'

// Загружаем переменные окружения из .env
config()

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://nudge-telegram-app.onrender.com/api/webhook/telegram'

async function setupWebhook() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN не установлен в .env')
    process.exit(1)
  }

  console.log('🔧 Настройка Telegram webhook...')
  console.log('📍 URL:', WEBHOOK_URL)

  try {
    // Устанавливаем webhook
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ['message']
        })
      }
    )

    const result = await response.json()

    if (result.ok) {
      console.log('✅ Webhook успешно установлен!')
      console.log('📝 Описание:', result.description)
    } else {
      console.error('❌ Ошибка установки webhook:', result.description)
      process.exit(1)
    }

    // Проверяем информацию о webhook
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
    )
    const info = await infoResponse.json()

    console.log('\n📊 Информация о webhook:')
    console.log('  URL:', info.result.url)
    console.log('  Pending updates:', info.result.pending_update_count)
    console.log('  Last error:', info.result.last_error_message || 'нет')

  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  }
}

setupWebhook()
