import { db } from '../../db'
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
    // Получить userId из query параметров (в реальном приложении из сессии/JWT)
    const query = getQuery(event)
    const userId = query.userId ? parseInt(query.userId as string) : null

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing userId parameter'
      })
    }

    // Получить все отслеживаемые контакты пользователя
    const userContacts = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.userId, userId),
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
          eq(reminders.userId, userId),
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
            userId,
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
