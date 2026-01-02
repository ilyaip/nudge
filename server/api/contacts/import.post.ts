import { db } from '../../db'
import { contacts, type NewContact } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

interface ImportContactData {
  telegramContactId: string
  name: string
  username?: string
  lastContactDate?: Date
}

interface ImportContactsRequest {
  userId: number
  contacts: ImportContactData[]
}

/**
 * POST /api/contacts/import
 * Импортировать контакты из Telegram
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ImportContactsRequest>(event)

    // Валидация обязательных полей
    if (!body.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing userId'
      })
    }

    if (!body.contacts || !Array.isArray(body.contacts)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing or invalid contacts array'
      })
    }

    // Валидация и санитизация каждого контакта
    const validatedContacts: ImportContactData[] = []
    const errors: string[] = []

    for (let i = 0; i < body.contacts.length; i++) {
      const contact = body.contacts[i]
      
      // Проверка обязательных полей
      if (!contact.telegramContactId || !contact.name) {
        errors.push(`Contact at index ${i}: missing telegramContactId or name`)
        continue
      }

      // Санитизация имени (удаление лишних пробелов)
      const sanitizedName = contact.name.trim()
      if (sanitizedName.length === 0) {
        errors.push(`Contact at index ${i}: name cannot be empty`)
        continue
      }

      // Санитизация username
      const sanitizedUsername = contact.username?.trim() || undefined

      // Валидация telegramContactId (должен быть непустой строкой)
      const sanitizedTelegramId = contact.telegramContactId.trim()
      if (sanitizedTelegramId.length === 0) {
        errors.push(`Contact at index ${i}: telegramContactId cannot be empty`)
        continue
      }

      validatedContacts.push({
        telegramContactId: sanitizedTelegramId,
        name: sanitizedName,
        username: sanitizedUsername,
        lastContactDate: contact.lastContactDate
      })
    }

    // Если есть ошибки валидации, вернуть их
    if (errors.length > 0 && validatedContacts.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'All contacts failed validation',
        data: { errors }
      })
    }

    // Получить существующие контакты пользователя для проверки дубликатов
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, body.userId))

    const existingTelegramIds = new Set(
      existingContacts.map(c => c.telegramContactId)
    )

    // Фильтровать дубликаты
    const newContacts = validatedContacts.filter(
      c => !existingTelegramIds.has(c.telegramContactId)
    )

    const skippedCount = validatedContacts.length - newContacts.length

    // Если нет новых контактов для импорта
    if (newContacts.length === 0) {
      return {
        success: true,
        imported: 0,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: 'No new contacts to import'
      }
    }

    // Подготовить данные для вставки с настройками по умолчанию
    const contactsToInsert: NewContact[] = newContacts.map(contact => ({
      userId: body.userId,
      telegramContactId: contact.telegramContactId,
      name: contact.name,
      username: contact.username || null,
      isTracked: false, // По умолчанию не отслеживается
      frequency: 'monthly', // По умолчанию ежемесячно
      customFrequencyDays: null,
      communicationType: 'message', // По умолчанию сообщение
      category: 'friends', // По умолчанию друзья
      lastContactDate: contact.lastContactDate || null,
      nextReminderDate: null // Будет рассчитано позже
    }))

    // Вставить контакты в базу данных
    const insertedContacts = await db
      .insert(contacts)
      .values(contactsToInsert)
      .returning()

    return {
      success: true,
      imported: insertedContacts.length,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      contacts: insertedContacts
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Error importing contacts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to import contacts'
    })
  }
})
