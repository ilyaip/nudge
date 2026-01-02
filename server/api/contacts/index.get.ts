import { db, schema } from '../../db'
import { contacts } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/contacts
 * Получить список всех контактов пользователя
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить Telegram ID из контекста
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

    // Получить все контакты пользователя (используем database user.id)
    const userContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, user.id))
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
