import { db } from '../../db'
import { contacts } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/contacts/:id
 * Получить детали контакта
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const query = getQuery(event)
    const userId = query.userId ? parseInt(query.userId as string) : null

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing contact id'
      })
    }

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing userId parameter'
      })
    }

    const contactId = parseInt(id)
    if (isNaN(contactId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid contact id'
      })
    }

    // Получить контакт с проверкой принадлежности пользователю
    const userContacts = await db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.userId, userId)
      ))
      .limit(1)

    if (userContacts.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contact not found'
      })
    }

    return {
      success: true,
      contact: userContacts[0]
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error fetching contact:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contact'
    })
  }
})
