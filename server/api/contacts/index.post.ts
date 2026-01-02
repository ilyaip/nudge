import { db } from '../../db'
import { contacts, type NewContact } from '../../db/schema'

interface CreateContactRequest {
  userId: number
  telegramContactId: string
  name: string
  username?: string
  isTracked?: boolean
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'custom'
  customFrequencyDays?: number
  communicationType?: 'message' | 'call' | 'meeting'
  category?: 'family' | 'friends' | 'colleagues' | 'business'
  lastContactDate?: Date
}

/**
 * POST /api/contacts
 * Добавить новый контакт
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateContactRequest>(event)

    // Валидация обязательных полей
    if (!body.userId || !body.telegramContactId || !body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId, telegramContactId, name'
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

    // Создать новый контакт
    const newContact: NewContact = {
      userId: body.userId,
      telegramContactId: body.telegramContactId,
      name: body.name,
      username: body.username || null,
      isTracked: body.isTracked ?? false,
      frequency: body.frequency || 'monthly',
      customFrequencyDays: body.customFrequencyDays || null,
      communicationType: body.communicationType || 'message',
      category: body.category || 'friends',
      lastContactDate: body.lastContactDate || null,
      nextReminderDate: null // Будет рассчитано позже
    }

    const createdContacts = await db
      .insert(contacts)
      .values(newContact)
      .returning()

    return {
      success: true,
      contact: createdContacts[0]
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error creating contact:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create contact'
    })
  }
})
