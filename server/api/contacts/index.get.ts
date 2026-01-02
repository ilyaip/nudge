import { db } from '../../db'
import { contacts } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/contacts
 * Получить список всех контактов пользователя
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

    // MOCK DATA для тестирования без БД
    // Раскомментируй это, если хочешь запустить без PostgreSQL:
    /*
    return {
      success: true,
      contacts: [
        {
          id: 1,
          userId: userId,
          telegramContactId: '123456',
          name: 'Иван Иванов',
          username: 'ivan_ivanov',
          isTracked: true,
          frequency: 'weekly',
          customFrequencyDays: null,
          communicationType: 'message',
          category: 'friends',
          lastContactDate: new Date('2024-12-25'),
          nextReminderDate: new Date('2025-01-08'),
          createdAt: new Date('2024-12-01'),
          updatedAt: new Date('2024-12-25')
        },
        {
          id: 2,
          userId: userId,
          telegramContactId: '789012',
          name: 'Мария Петрова',
          username: 'maria_p',
          isTracked: true,
          frequency: 'monthly',
          customFrequencyDays: null,
          communicationType: 'call',
          category: 'family',
          lastContactDate: new Date('2024-12-20'),
          nextReminderDate: new Date('2025-01-20'),
          createdAt: new Date('2024-11-15'),
          updatedAt: new Date('2024-12-20')
        },
        {
          id: 3,
          userId: userId,
          telegramContactId: '345678',
          name: 'Алексей Сидоров',
          username: null,
          isTracked: false,
          frequency: 'monthly',
          customFrequencyDays: null,
          communicationType: 'message',
          category: 'colleagues',
          lastContactDate: null,
          nextReminderDate: null,
          createdAt: new Date('2024-12-28'),
          updatedAt: new Date('2024-12-28')
        }
      ]
    }
    */

    // Получить все контакты пользователя
    const userContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId))
      .orderBy(contacts.name)

    return {
      success: true,
      contacts: userContacts
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error fetching contacts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contacts'
    })
  }
})
