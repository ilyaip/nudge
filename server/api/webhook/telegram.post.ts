import { db, schema } from '../../db'
import { eq, and } from 'drizzle-orm'

/**
 * POST /api/webhook/telegram
 * Webhook для обработки обновлений от Telegram бота
 * 
 * Обрабатывает:
 * - Команды бота (/start, /help)
 * - Пересланные контакты (для импорта)
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    console.log('[Telegram Webhook] Received update:', JSON.stringify(body, null, 2))

    // Проверяем, что это сообщение
    if (!body.message) {
      return { ok: true }
    }

    const message = body.message
    const chatId = message.chat.id
    const userId = message.from.id

    // Обработка команд
    if (message.text) {
      const text = message.text.trim()

      // Команда /start
      if (text === '/start' || text === '/start@NudgeMeNow_bot') {
        await sendTelegramMessage(chatId, 
          '👋 Привет! Я бот Nudge.\n\n' +
          '📱 Чтобы добавить контакты:\n' +
          '1. Нажмите 📎 (скрепка) внизу\n' +
          '2. Выберите "Контакт"\n' +
          '3. Выберите контакт из списка\n' +
          '4. Отправьте мне\n\n' +
          'Я автоматически добавлю контакт в ваше приложение! ✨\n\n' +
          '💡 Примечание: опция "Контакт" доступна только в мобильной версии Telegram.'
        )
        return { ok: true }
      }

      // Команда /help
      if (text === '/help' || text === '/help@NudgeMeNow_bot') {
        await sendTelegramMessage(chatId,
          '❓ Помощь по боту Nudge\n\n' +
          '📱 Как добавить контакт:\n' +
          '• Нажмите 📎 (скрепка)\n' +
          '• Выберите "Контакт"\n' +
          '• Выберите контакт\n' +
          '• Отправьте мне\n\n' +
          '✅ Контакт будет автоматически добавлен в приложение!'
        )
        return { ok: true }
      }
    }

    // Обработка пересланного контакта
    if (message.contact) {
      const contact = message.contact
      
      console.log('[Telegram Webhook] Contact received:', contact)

      // Найти пользователя по Telegram ID
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.telegramId, String(userId)))
        .limit(1)

      if (!user) {
        await sendTelegramMessage(chatId,
          '❌ Пользователь не найден.\n\n' +
          'Пожалуйста, сначала откройте Mini App Nudge, чтобы создать аккаунт.'
        )
        return { ok: true }
      }

      // Проверить, не добавлен ли уже этот контакт ЭТИМ пользователем
      const [existingContact] = await db
        .select()
        .from(schema.contacts)
        .where(and(
          eq(schema.contacts.userId, user.id),
          eq(schema.contacts.telegramContactId, String(contact.user_id))
        ))
        .limit(1)

      if (existingContact) {
        await sendTelegramMessage(chatId,
          `ℹ️ Контакт "${contact.first_name}" уже добавлен в ваше приложение.`
        )
        return { ok: true }
      }

      // Добавить контакт в базу данных
      const contactName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      
      await db
        .insert(schema.contacts)
        .values({
          userId: user.id,
          telegramContactId: String(contact.user_id),
          name: contactName,
          username: null, // Telegram не передает username в contact
          isTracked: false, // По умолчанию не отслеживается
          frequency: 'monthly',
          customFrequencyDays: null,
          communicationType: 'message',
          category: 'friends', // По умолчанию друзья
          lastContactDate: null,
          nextReminderDate: null
        })

      console.log('[Telegram Webhook] Contact added:', contactName)

      // Отправить подтверждение
      await sendTelegramMessage(chatId,
        `✅ Контакт "${contactName}" добавлен!\n\n` +
        '📱 Откройте приложение Nudge, чтобы настроить отслеживание.'
      )

      return { ok: true }
    }

    // Неизвестный тип сообщения
    await sendTelegramMessage(chatId,
      '❓ Пожалуйста, отправьте мне контакт.\n\n' +
      'Нажмите 📎 → Контакт → Выберите контакт'
    )

    return { ok: true }
  } catch (error: any) {
    console.error('[Telegram Webhook] Error:', error)
    
    // Возвращаем 200 OK, чтобы Telegram не повторял запрос
    return { ok: true, error: error.message }
  }
})

/**
 * Отправить сообщение через Telegram Bot API
 */
async function sendTelegramMessage(chatId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    console.error('[Telegram Webhook] Bot token not configured')
    return
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Telegram Webhook] Failed to send message:', error)
    }
  } catch (error) {
    console.error('[Telegram Webhook] Error sending message:', error)
  }
}
