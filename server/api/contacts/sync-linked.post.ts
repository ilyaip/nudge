/**
 * POST /api/contacts/sync-linked
 * Синхронизирует linkedUserId для всех контактов
 * Находит контакты, чей telegramContactId соответствует зарегистрированному пользователю
 */
import { db } from '../../db'
import { contacts, users } from '../../db/schema'
import { eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Получаем все контакты без linkedUserId
    const allContacts = await db
      .select()
      .from(contacts)
      .where(isNull(contacts.linkedUserId))

    // Получаем всех пользователей
    const allUsers = await db.select().from(users)
    
    // Создаём map telegramId -> userId
    const userMap = new Map<string, number>()
    for (const user of allUsers) {
      userMap.set(user.telegramId, user.id)
    }

    let updatedCount = 0

    // Обновляем контакты
    for (const contact of allContacts) {
      const linkedUserId = userMap.get(contact.telegramContactId)
      
      if (linkedUserId) {
        await db
          .update(contacts)
          .set({ linkedUserId })
          .where(eq(contacts.id, contact.id))
        
        updatedCount++
        console.log(`[Sync] Updated contact ${contact.id} (${contact.name}) -> linkedUserId: ${linkedUserId}`)
      }
    }

    return {
      success: true,
      message: `Синхронизировано ${updatedCount} контактов`,
      totalContacts: allContacts.length,
      updatedCount,
      totalUsers: allUsers.length
    }
  } catch (error: any) {
    console.error('Error syncing linked contacts:', error)
    throw createError({
      statusCode: 500,
      message: `Sync failed: ${error.message}`
    })
  }
})
