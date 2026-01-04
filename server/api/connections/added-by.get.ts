import { db } from '../../db'
import { contacts, users } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/connections/added-by
 * Возвращает список пользователей, которые добавили текущего пользователя в свои контакты
 */
export default defineEventHandler(async (event) => {
  try {
    const telegramUser = event.context.telegramUser
    const telegramId = telegramUser?.id

    if (!telegramId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Telegram user not found'
      })
    }

    // Найти текущего пользователя
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, String(telegramId)))
      .limit(1)

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }

    // Найти контакты, где linkedUserId = текущий пользователь
    const addedByContacts = await db
      .select({
        contact: contacts,
        user: users
      })
      .from(contacts)
      .innerJoin(users, eq(contacts.userId, users.id))
      .where(eq(contacts.linkedUserId, currentUser.id))

    return {
      success: true,
      connections: addedByContacts.map(({ contact, user }) => ({
        contactId: contact.id,
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isMutual: contact.isMutual,
        addedAt: contact.createdAt
      }))
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching added-by connections:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch connections'
    })
  }
})
