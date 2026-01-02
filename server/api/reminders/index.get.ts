import { db, schema } from '../../db'
import { reminders, contacts } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { getContactsDueForReminder } from '../../utils/reminders'

/**
 * GET /api/reminders
 * Получить сегодняшние напоминания для пользователя
 * 
 * Query параметры:
 * - userId: ID пользователя
 * 
 * Возвращает список напоминаний с информацией о контактах
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить Telegram ID из контекста (установлен middleware)
    const telegramUser = event.context.telegramUser
    const telegramId = telegramUser?.id

    if (!telegramId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Telegram user not found'
      })
    }

    // Найти пользователя по Telegram ID
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramId, String(telegramId)))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }

    // Получить все отслеживаемые контакты пользователя (используем database user.id)
    const userContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, user.id),
          eq(contacts.isTracked, true)
        )
      )

    // Определить контакты, требующие напоминания сегодня
    const today = new Date()
    const dueContacts = getContactsDueForReminder(userContacts, today)

    // Получить существующие напоминания для этих контактов на сегодня
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const existingReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.userId, user.id),
          eq(reminders.completed, false)
        )
      )

    // Создать мапу существующих напоминаний по contactId
    const existingReminderMap = new Map(
      existingReminders.map(r => [r.contactId, r])
    )

    // Создать или получить напоминания для контактов, требующих напоминания
    const todayReminders = []
    
    for (const contact of dueContacts) {
      let reminder = existingReminderMap.get(contact.id)
      
      // Если напоминания нет, создаем новое
      if (!reminder) {
        const [newReminder] = await db
          .insert(reminders)
          .values({
            userId: user.id,
            contactId: contact.id,
            dueDate: todayStart,
            completed: false,
            notificationSent: false
          })
          .returning()
        
        reminder = newReminder
      }
      
      // Добавляем информацию о контакте к напоминанию
      todayReminders.push({
        ...reminder,
        contact
      })
    }

    return {
      success: true,
      reminders: todayReminders,
      count: todayReminders.length
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Ошибка при получении напоминаний:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось получить напоминания'
    })
  }
})
