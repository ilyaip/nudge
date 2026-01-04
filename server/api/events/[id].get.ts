import { db } from '../../db'
import { events, eventParticipants, contacts, users } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/events/[id]
 * Получить детали события с участниками
 * Requirement: 4.1
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
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено'
      })
    }

    // Получаем информацию об организаторе
    const [organizer] = await db
      .select({
        id: users.id,
        telegramId: users.telegramId,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(users)
      .where(eq(users.id, eventData.organizerId))
      .limit(1)

    // Получаем участников с информацией о контактах
    const participants = await db
      .select({
        participant: eventParticipants,
        contact: contacts
      })
      .from(eventParticipants)
      .leftJoin(contacts, eq(eventParticipants.contactId, contacts.id))
      .where(eq(eventParticipants.eventId, eventId))

    // Формируем ответ
    const participantsData = participants.map(p => ({
      id: p.participant.id,
      eventId: p.participant.eventId,
      contactId: p.participant.contactId,
      status: p.participant.status,
      respondedAt: p.participant.respondedAt,
      createdAt: p.participant.createdAt,
      contact: p.contact ? {
        id: p.contact.id,
        name: p.contact.name,
        username: p.contact.username,
        linkedUserId: p.contact.linkedUserId,
        isMutual: p.contact.isMutual
      } : null
    }))

    // Проверяем, является ли текущий пользователь организатором
    const isOrganizer = eventData.organizerId === user.id

    return {
      success: true,
      event: {
        ...eventData,
        organizer,
        participants: participantsData,
        participantCount: participantsData.length,
        isOrganizer
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch event'
    })
  }
})
