import { db } from '../../db'
import { events, eventParticipants, contacts, users } from '../../db/schema'
import { eq, and, or, gte, lte, inArray, sql } from 'drizzle-orm'
import { EVENT_STATUSES, type EventStatus } from '../../utils/events'

/**
 * GET /api/events
 * Список событий пользователя (как организатор или участник)
 * Поддержка фильтрации по статусу, диапазону дат
 * Requirement: 9.5
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

    // Получаем параметры фильтрации
    const query = getQuery(event)
    const status = query.status as EventStatus | undefined
    const startFrom = query.startFrom as string | undefined
    const startTo = query.startTo as string | undefined
    const upcoming = query.upcoming === 'true'

    // Валидация статуса
    if (status && !EVENT_STATUSES.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Недопустимый статус. Допустимые значения: ${EVENT_STATUSES.join(', ')}`
      })
    }

    // Получаем контакты пользователя для поиска событий где он участник
    const userContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.linkedUserId, user.id))

    const contactIds = userContacts.map(c => c.id)

    // Строим условия запроса
    const conditions: any[] = []

    // События где пользователь организатор
    const organizerCondition = eq(events.organizerId, user.id)

    // События где пользователь участник (через контакты других пользователей)
    let participantEventIds: number[] = []
    if (contactIds.length > 0) {
      const participantEvents = await db
        .select({ eventId: eventParticipants.eventId })
        .from(eventParticipants)
        .where(inArray(eventParticipants.contactId, contactIds))

      participantEventIds = participantEvents.map(p => p.eventId)
    }

    // Основное условие: организатор ИЛИ участник
    if (participantEventIds.length > 0) {
      conditions.push(
        or(
          organizerCondition,
          inArray(events.id, participantEventIds)
        )
      )
    } else {
      conditions.push(organizerCondition)
    }

    // Фильтр по статусу
    if (status) {
      conditions.push(eq(events.status, status))
    }

    // Фильтр по диапазону дат
    if (startFrom) {
      const fromDate = new Date(startFrom)
      if (!isNaN(fromDate.getTime())) {
        conditions.push(gte(events.startDate, fromDate))
      }
    }

    if (startTo) {
      const toDate = new Date(startTo)
      if (!isNaN(toDate.getTime())) {
        conditions.push(lte(events.startDate, toDate))
      }
    }

    // Фильтр "предстоящие" - события на ближайшие 7 дней
    // Requirement 9.5: show events for the next 7 days by default
    if (upcoming) {
      const now = new Date()
      const weekLater = new Date()
      weekLater.setDate(weekLater.getDate() + 7)

      conditions.push(gte(events.startDate, now))
      conditions.push(lte(events.startDate, weekLater))
      conditions.push(
        and(
          sql`${events.status} != 'cancelled'`,
          sql`${events.status} != 'completed'`
        )
      )
    }

    // Выполняем запрос
    const eventsData = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(events.startDate)

    // Получаем участников для каждого события
    const eventIds = eventsData.map(e => e.id)
    let participantsMap: Map<number, any[]> = new Map()

    if (eventIds.length > 0) {
      const allParticipants = await db
        .select({
          participant: eventParticipants,
          contact: contacts
        })
        .from(eventParticipants)
        .leftJoin(contacts, eq(eventParticipants.contactId, contacts.id))
        .where(inArray(eventParticipants.eventId, eventIds))

      for (const p of allParticipants) {
        const eventId = p.participant.eventId
        if (!participantsMap.has(eventId)) {
          participantsMap.set(eventId, [])
        }
        participantsMap.get(eventId)!.push({
          ...p.participant,
          contact: p.contact
        })
      }
    }

    // Формируем ответ с участниками
    const eventsWithParticipants = eventsData.map(e => ({
      ...e,
      participants: participantsMap.get(e.id) || [],
      participantCount: (participantsMap.get(e.id) || []).length
    }))

    return {
      success: true,
      events: eventsWithParticipants
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch events'
    })
  }
})
