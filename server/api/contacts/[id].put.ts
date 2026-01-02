import { db, schema } from '../../db'
import { contacts } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

interface UpdateContactRequest {
  name?: string
  username?: string
  isTracked?: boolean
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'custom'
  customFrequencyDays?: number
  communicationType?: 'message' | 'call' | 'meeting'
  category?: 'family' | 'friends' | 'colleagues' | 'business'
  lastContactDate?: Date | null
  nextReminderDate?: Date | null
}

/**
 * PUT /api/contacts/:id
 * Обновить настройки контакта
 */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<UpdateContactRequest>(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing contact id'
      })
    }

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

    const contactId = parseInt(id)
    if (isNaN(contactId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid contact id'
      })
    }

    // Проверить существование контакта и принадлежность пользователю (используем database user.id)
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.userId, user.id)
      ))
      .limit(1)

    if (existingContacts.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contact not found'
      })
    }

    // Валидация frequency
    const validFrequencies = ['weekly', 'monthly', 'quarterly', 'custom']
    if (body.frequency && !validFrequencies.includes(body.frequency)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid frequency. Must be one of: weekly, monthly, quarterly, custom'
      })
    }

    // Валидация communicationType
    const validTypes = ['message', 'call', 'meeting']
    if (body.communicationType && !validTypes.includes(body.communicationType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid communicationType. Must be one of: message, call, meeting'
      })
    }

    // Валидация category
    const validCategories = ['family', 'friends', 'colleagues', 'business']
    if (body.category && !validCategories.includes(body.category)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid category. Must be one of: family, friends, colleagues, business'
      })
    }

    // Валидация customFrequencyDays для custom frequency
    if (body.frequency === 'custom' && (!body.customFrequencyDays || body.customFrequencyDays <= 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'customFrequencyDays is required and must be positive for custom frequency'
      })
    }

    // Подготовить данные для обновления
    const updateData: any = {
      updatedAt: new Date()
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.username !== undefined) updateData.username = body.username
    if (body.isTracked !== undefined) updateData.isTracked = body.isTracked
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.customFrequencyDays !== undefined) updateData.customFrequencyDays = body.customFrequencyDays
    if (body.communicationType !== undefined) updateData.communicationType = body.communicationType
    if (body.category !== undefined) updateData.category = body.category
    if (body.lastContactDate !== undefined) updateData.lastContactDate = body.lastContactDate
    if (body.nextReminderDate !== undefined) updateData.nextReminderDate = body.nextReminderDate

    // Обновить контакт
    const updatedContacts = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, contactId))
      .returning()

    return {
      success: true,
      contact: updatedContacts[0]
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error updating contact:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update contact'
    })
  }
})
