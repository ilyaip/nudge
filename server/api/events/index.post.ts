import { db } from '../../db'
import { events, eventParticipants, invitations, contacts, users } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import {
  validateCreateEventRequest,
  formatValidationErrors,
  calculateEndDate,
  type CreateEventRequest,
  type RecurrencePattern
} from '../../utils/events'
import { generateOccurrences, type RecurrenceConfig } from '../../utils/recurrence'

/**
 * POST /api/events
 * Создание нового события
 * Requirements: 4.1, 5.3, 6.1, 6.2, 6.3
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateEventRequest>(event)

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

    // Валидация запроса
    const validationErrors = validateCreateEventRequest(body)
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: formatValidationErrors(validationErrors)
      })
    }

    // Парсим дату и вычисляем endDate
    const startDate = new Date(body.startDate)
    const endDate = calculateEndDate(startDate, body.duration)

    // Создаём родительское событие
    const [createdEvent] = await db
      .insert(events)
      .values({
        organizerId: user.id,
        title: body.title.trim(),
        type: body.type,
        customType: body.type === 'other' ? body.customType?.trim() : null,
        description: body.description?.trim() || null,
        startDate,
        endDate,
        duration: body.duration,
        status: 'scheduled',
        isRecurring: body.isRecurring || false,
        recurrencePattern: body.isRecurring ? body.recurrencePattern : null,
        recurrenceInterval: body.isRecurring && body.recurrencePattern === 'custom' 
          ? body.recurrenceInterval 
          : null,
        reminderMinutes: body.reminderMinutes ?? 60
      })
      .returning()

    // Создаём дочерние события для повторяющихся событий
    // Requirement 5.3: Generate future event instances based on recurrence pattern
    const childEvents: typeof events.$inferSelect[] = []
    
    if (body.isRecurring && body.recurrencePattern) {
      const recurrenceConfig: RecurrenceConfig = {
        startDate,
        pattern: body.recurrencePattern as RecurrencePattern,
        interval: body.recurrenceInterval,
        count: body.recurrenceCount // Optional: number of occurrences to generate
      }

      try {
        const occurrences = generateOccurrences(recurrenceConfig, body.duration)

        for (const occurrence of occurrences) {
          const [childEvent] = await db
            .insert(events)
            .values({
              organizerId: user.id,
              title: body.title.trim(),
              type: body.type,
              customType: body.type === 'other' ? body.customType?.trim() : null,
              description: body.description?.trim() || null,
              startDate: occurrence.startDate,
              endDate: occurrence.endDate,
              duration: body.duration,
              status: 'scheduled',
              isRecurring: false, // Child events are not recurring themselves
              recurrencePattern: null,
              recurrenceInterval: null,
              parentEventId: createdEvent.id, // Link to parent event
              reminderMinutes: body.reminderMinutes ?? 60
            })
            .returning()

          childEvents.push(childEvent)
        }
      } catch (recurrenceError: any) {
        console.error('Error generating recurrence:', recurrenceError)
        // Continue without child events if recurrence generation fails
      }
    }

    // Добавляем участников если указаны
    const participants: typeof eventParticipants.$inferSelect[] = []
    const createdInvitations: typeof invitations.$inferSelect[] = []

    if (body.participantContactIds && body.participantContactIds.length > 0) {
      // Получаем контакты с информацией о связанных пользователях
      const contactsData = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, user.id)
          )
        )

      // Фильтруем только те контакты, которые принадлежат пользователю
      const userContactIds = new Set(contactsData.map(c => c.id))
      const validContactIds = body.participantContactIds.filter(id => userContactIds.has(id))

      // Все события (родительское + дочерние) для добавления участников
      const allEventIds = [createdEvent.id, ...childEvents.map(e => e.id)]

      for (const contactId of validContactIds) {
        const contact = contactsData.find(c => c.id === contactId)
        if (!contact) continue

        // Создаём записи участников для всех событий серии
        for (const eventId of allEventIds) {
          const [participant] = await db
            .insert(eventParticipants)
            .values({
              eventId,
              contactId: contact.id,
              status: 'pending'
            })
            .returning()

          // Добавляем только участников родительского события в ответ
          if (eventId === createdEvent.id) {
            participants.push(participant)
          }
        }

        // Если контакт связан с пользователем системы, создаём приглашение
        // Requirement 6.2: send invitation notification for linked contacts
        // Приглашение создаётся только для родительского события
        if (contact.linkedUserId) {
          const [invitation] = await db
            .insert(invitations)
            .values({
              eventId: createdEvent.id,
              inviterId: user.id,
              inviteeId: contact.linkedUserId,
              status: 'pending'
            })
            .returning()

          createdInvitations.push(invitation)
        }
        // Requirement 6.3: non-linked contacts are added without notification
      }
    }

    return {
      success: true,
      event: createdEvent,
      childEvents: childEvents.length > 0 ? childEvents : undefined,
      participants,
      invitations: createdInvitations
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error creating event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create event'
    })
  }
})
