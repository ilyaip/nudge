import { db } from '../../db'
import { events, users } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * DELETE /api/events/[id]
 * Удаление события (только организатор)
 * Каскадное удаление участников и приглашений (через ON DELETE CASCADE)
 * Requirement: 8.4
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
      .from(users)
      .where(eq(users.telegramId, String(telegramId)))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }

    // Получаем ID события из параметров
    const eventId = parseInt(event.context.params?.id || '')
    if (isNaN(eventId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID события'
      })
    }

    // Получаем событие
    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!existingEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено'
      })
    }

    // Проверяем, что пользователь является организатором
    // Requirement 8.4: only organizer can delete event
    if (existingEvent.organizerId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Только организатор может удалить событие'
      })
    }

    // Удаляем событие (участники и приглашения удалятся каскадно)
    await db
      .delete(events)
      .where(eq(events.id, eventId))

    return {
      success: true,
      message: 'Событие успешно удалено'
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete event'
    })
  }
})
