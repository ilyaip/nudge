import { createHmac } from 'crypto'
import { db } from '../db'
import { reminders, contacts, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateNextReminderDate } from '../utils/reminders'
import { awardXP, type ActionType } from '../utils/gamification'

/**
 * Интерфейс для Telegram Update
 */
interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      type: string
    }
    date: number
    text?: string
    entities?: Array<{
      type: string
      offset: number
      length: number
      url?: string
      user?: any
    }>
  }
}

/**
 * Интерфейс для команды завершения
 */
interface CompleteCommand {
  type: 'complete'
  contactName?: string
  contactUsername?: string
}

/**
 * POST /api/webhook
 * Обработка webhook от Telegram Bot
 * 
 * Валидирует подпись webhook и обрабатывает команды бота
 * 
 * Поддерживаемые команды:
 * - /done - отметить все сегодняшние напоминания как выполненные
 * - /done @username - отметить напоминание для конкретного контакта
 * - /complete - аналог /done
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить токен бота из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    
    if (!botToken) {
      console.error('[Webhook] TELEGRAM_BOT_TOKEN не установлен')
      throw createError({
        statusCode: 500,
        statusMessage: 'Bot token not configured'
      })
    }

    // Получить тело запроса
    const body = await readBody<TelegramUpdate>(event)
    
    if (!body || !body.message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid webhook payload'
      })
    }

    // Валидация подписи webhook (если передана в заголовке)
    const signature = getHeader(event, 'x-telegram-bot-api-secret-token')
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    
    if (expectedSecret && signature !== expectedSecret) {
      console.error('[Webhook] Неверная подпись webhook')
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid webhook signature'
      })
    }

    const message = body.message
    const telegramUserId = String(message.from.id)
    const text = message.text?.trim() || ''

    console.log(`[Webhook] Получено сообщение от пользователя ${telegramUserId}: ${text}`)

    // Найти пользователя в базе данных
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramUserId))
      .limit(1)

    if (!user) {
      console.error(`[Webhook] Пользователь ${telegramUserId} не найден в базе данных`)
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Парсинг команды
    const command = parseCommand(text)
    
    if (!command) {
      // Неизвестная команда - игнорируем
      console.log(`[Webhook] Неизвестная команда: ${text}`)
      return {
        success: true,
        message: 'Command not recognized'
      }
    }

    // Обработка команды завершения
    if (command.type === 'complete') {
      const result = await handleCompleteCommand(user.id, command)
      return result
    }

    return {
      success: true,
      message: 'Command processed'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Webhook] Ошибка обработки webhook:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook processing failed'
    })
  }
})

/**
 * Парсинг команды из текста сообщения
 * @param text - Текст сообщения
 * @returns Распознанная команда или null
 */
function parseCommand(text: string): CompleteCommand | null {
  const lowerText = text.toLowerCase()
  
  // Команды завершения: /done, /complete
  if (lowerText.startsWith('/done') || lowerText.startsWith('/complete')) {
    // Проверяем, есть ли упоминание пользователя (@username)
    const usernameMatch = text.match(/@(\w+)/)
    
    if (usernameMatch) {
      return {
        type: 'complete',
        contactUsername: usernameMatch[1]
      }
    }
    
    // Проверяем, есть ли имя контакта (текст после команды)
    const parts = text.split(/\s+/)
    if (parts.length > 1) {
      const contactName = parts.slice(1).join(' ').replace(/@/g, '').trim()
      if (contactName) {
        return {
          type: 'complete',
          contactName
        }
      }
    }
    
    // Команда без параметров - завершить все напоминания
    return {
      type: 'complete'
    }
  }
  
  return null
}

/**
 * Обработка команды завершения напоминания
 * @param userId - ID пользователя
 * @param command - Команда завершения
 * @returns Результат выполнения команды
 */
async function handleCompleteCommand(
  userId: number,
  command: CompleteCommand
): Promise<{ success: boolean; message: string; completedCount?: number }> {
  try {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // Получить сегодняшние невыполненные напоминания
    let query = db
      .select({
        reminder: reminders,
        contact: contacts
      })
      .from(reminders)
      .innerJoin(contacts, eq(reminders.contactId, contacts.id))
      .where(
        and(
          eq(reminders.userId, userId),
          eq(reminders.completed, false),
          eq(reminders.dueDate, today)
        )
      )

    const todayReminders = await query

    if (todayReminders.length === 0) {
      console.log(`[Webhook] У пользователя ${userId} нет невыполненных напоминаний на сегодня`)
      return {
        success: true,
        message: 'Нет невыполненных напоминаний на сегодня',
        completedCount: 0
      }
    }

    // Фильтрация по контакту, если указан
    let remindersToComplete = todayReminders
    
    if (command.contactUsername) {
      remindersToComplete = todayReminders.filter(
        r => r.contact.username?.toLowerCase() === command.contactUsername?.toLowerCase()
      )
      
      if (remindersToComplete.length === 0) {
        console.log(
          `[Webhook] Контакт с username @${command.contactUsername} не найден в напоминаниях`
        )
        return {
          success: false,
          message: `Контакт @${command.contactUsername} не найден в сегодняшних напоминаниях`
        }
      }
    } else if (command.contactName) {
      remindersToComplete = todayReminders.filter(
        r => r.contact.name.toLowerCase().includes(command.contactName!.toLowerCase())
      )
      
      if (remindersToComplete.length === 0) {
        console.log(
          `[Webhook] Контакт с именем "${command.contactName}" не найден в напоминаниях`
        )
        return {
          success: false,
          message: `Контакт "${command.contactName}" не найден в сегодняшних напоминаниях`
        }
      }
    }

    // Завершить напоминания
    let completedCount = 0
    
    for (const { reminder, contact } of remindersToComplete) {
      // Обновить напоминание
      await db
        .update(reminders)
        .set({
          completed: true,
          completedAt: now
        })
        .where(eq(reminders.id, reminder.id))

      // Обновить контакт
      const updatedContact = {
        ...contact,
        lastContactDate: now
      }
      
      const nextReminderDate = calculateNextReminderDate(updatedContact)

      await db
        .update(contacts)
        .set({
          lastContactDate: now,
          nextReminderDate: nextReminderDate,
          updatedAt: now
        })
        .where(eq(contacts.id, contact.id))

      completedCount++
      
      console.log(
        `[Webhook] Напоминание ${reminder.id} для контакта "${contact.name}" отмечено как выполненное`
      )
    }

    // Начислить XP за выполнение напоминаний
    if (completedCount > 0) {
      await awardXP(userId, 'REMINDER_COMPLETED', {
        count: completedCount,
        source: 'webhook'
      })
      
      console.log(`[Webhook] Начислено XP пользователю ${userId} за ${completedCount} напоминаний`)
    }

    const message = completedCount === 1
      ? `Напоминание успешно выполнено!`
      : `Выполнено напоминаний: ${completedCount}`

    return {
      success: true,
      message,
      completedCount
    }
  } catch (error) {
    console.error('[Webhook] Ошибка при обработке команды завершения:', error)
    throw error
  }
}
