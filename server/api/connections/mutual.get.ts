import { db } from '../../db'
import { contacts, users } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/connections/mutual
 * Возвращает список взаимных связей текущего пользователя
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

    // Найти контакты текущего пользователя с isMutual = true
    const mutualContacts = await db
      .select({
        contact: contacts,
        linkedUser: users
      })
      .from(contacts)
      .innerJoin(users, eq(contacts.linkedUserId, users.id))
      .where(
        and(
          eq(contacts.userId, currentUser.id),
          eq(contacts.isMutual, true)
        )
      )

    return {
      success: true,
      connections: mutualContacts.map(({ contact, linkedUser }) => ({
        contactId: contact.id,
        contactName: contact.name,
        userId: linkedUser.id,
        telegramId: linkedUser.telegramId,
        username: linkedUser.username,
        firstName: linkedUser.firstName,
        lastName: linkedUser.lastName,
        addedAt: contact.createdAt
      }))
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching mutual connections:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch mutual connections'
    })
  }
})
