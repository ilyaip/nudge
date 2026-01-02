import { db } from '../../../db'
import { reminders, contacts } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateNextReminderDate } from '../../../utils/reminders'

/**
 * POST /api/reminders/:id/complete
 * Отметить напоминание как выполненное
 * 
 * Параметры маршрута:
 * - id: ID напоминания
 * 
 * Body параметры:
 * - userId: ID пользователя (для проверки прав доступа)
 * 
 * Действия:
 * 1. Отметить напоминание как выполненное
 * 2. Обновить lastContactDate контакта на сегодня
 * 3. Рассчитать и обновить nextReminderDate контакта
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить ID напоминания из параметров маршрута
    const reminderId = parseInt(event.context.params?.id || '0')
    
    if (!reminderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reminder ID'
      })
    }

    // Получить userId из body
    const body = await readBody(event)
    const userId = body.userId

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing userId in request body'
      })
    }

    // Получить напоминание и проверить, что оно принадлежит пользователю
    const [reminder] = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.id, reminderId),
          eq(reminders.userId, userId)
        )
      )
      .limit(1)

    if (!reminder) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Напоминание не найдено'
      })
    }

    // Проверить, что напоминание еще не выполнено
    if (reminder.completed) {
      return {
        success: true,
        message: 'Напоминание уже было выполнено',
        reminder
      }
    }

    // Текущая дата и время
    const now = new Date()

    // Обновить напоминание - отметить как выполненное
    const [updatedReminder] = await db
      .update(reminders)
      .set({
        completed: true,
        completedAt: now
      })
      .where(eq(reminders.id, reminderId))
      .returning()

    // Получить связанный контакт
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, reminder.contactId))
      .limit(1)

    if (!contact) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Контакт не найден'
      })
    }

    // Обновить контакт - установить lastContactDate на сегодня
    // и рассчитать nextReminderDate
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

    return {
      success: true,
      message: 'Напоминание успешно выполнено',
      reminder: updatedReminder,
      contact: {
        ...contact,
        lastContactDate: now,
        nextReminderDate: nextReminderDate
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Ошибка при завершении напоминания:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось завершить напоминание'
    })
  }
})
