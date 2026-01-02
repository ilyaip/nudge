import { db } from '../../db'
import { contacts } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * DELETE /api/contacts/:id
 * Удалить контакт
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

    // Проверить существование контакта и принадлежность пользователю
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.userId, userId)
      ))
      .limit(1)

    if (existingContacts.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contact not found'
      })
    }

    // Удалить контакт (каскадное удаление напоминаний настроено в схеме)
    await db
      .delete(contacts)
      .where(eq(contacts.id, contactId))

    return {
      success: true,
      message: 'Contact deleted successfully'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error deleting contact:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete contact'
    })
  }
})
