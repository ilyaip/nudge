import { db } from '../../db'
import { events, eventParticipants, invitations, contacts, users } from '../../db/schema'
import { eq, and, inArray, notInArray } from 'drizzle-orm'
import {
  validateUpdateEventRequest,
  formatValidationErrors,
  calculateEndDate,
  type UpdateEventRequest
} from '../../utils/events'

/**
 * PUT /api/events/[id]
 * Обновление события (только организатор)
 * Обработка изменений участников
 * Requirement: 8.4
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<UpdateEventRequest>(event)

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
    // Requirement 8.4: only organizer can modify event
    if (existingEvent.organizerId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Только организатор может изменить событие'
      })
    }

    // Проверяем, что событие не отменено
    if (existingEvent.status === 'cancelled') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нельзя изменить отменённое событие'
      })
    }

    // Валидация запроса
    const validationErrors = validateUpdateEventRequest(body)
    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: formatValidationErrors(validationErrors)
      })
    }

    // Подготавливаем данные для обновления
    const updateData: Partial<typeof events.$inferInsert> = {
      updatedAt: new Date()
    }

    if (body.title !== undefined) {
      updateData.title = body.title.trim()
    }

    if (body.type !== undefined) {
      updateData.type = body.type
      updateData.customType = body.type === 'other' ? body.customType?.trim() : null
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    if (body.startDate !== undefined) {
      const startDate = new Date(body.startDate)
      updateData.startDate = startDate
      
      // Пересчитываем endDate если изменилась дата или продолжительность
      const duration = body.duration ?? existingEvent.duration
      updateData.endDate = calculateEndDate(startDate, duration)
    }

    if (body.duration !== undefined) {
      updateData.duration = body.duration
      
      // Пересчитываем endDate
      const startDate = body.startDate ? new Date(body.startDate) : existingEvent.startDate
      updateData.endDate = calculateEndDate(startDate, body.duration)
    }

    if (body.isRecurring !== undefined) {
      updateData.isRecurring = body.isRecurring
      if (body.isRecurring) {
        updateData.recurrencePattern = body.recurrencePattern || null
        updateData.recurrenceInterval = body.recurrencePattern === 'custom' 
          ? body.recurrenceInterval 
          : null
      } else {
        updateData.recurrencePattern = null
        updateData.recurrenceInterval = null
      }
    }

    if (body.reminderMinutes !== undefined) {
      updateData.reminderMinutes = body.reminderMinutes
    }

    // Обновляем событие
    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning()

    // Обрабатываем изменения участников если указаны
    let participants: typeof eventParticipants.$inferSelect[] = []
    let createdInvitations: typeof invitations.$inferSelect[] = []

    if (body.participantContactIds !== undefined) {
      // Получаем текущих участников
      const currentParticipants = await db
        .select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))

      const currentContactIds = currentParticipants.map(p => p.contactId)
      const newContactIds = body.participantContactIds

      // Контакты для удаления
      const toRemove = currentContactIds.filter(id => !newContactIds.includes(id))
      
      // Контакты для добавления
      const toAdd = newContactIds.filter(id => !currentContactIds.includes(id))

      // Удаляем участников
      if (toRemove.length > 0) {
        await db
          .delete(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, eventId),
              inArray(eventParticipants.contactId, toRemove)
            )
          )

        // Удаляем связанные приглашения
        const contactsToRemove = await db
          .select()
          .from(contacts)
          .where(inArray(contacts.id, toRemove))

        const linkedUserIds = contactsToRemove
          .filter(c => c.linkedUserId)
          .map(c => c.linkedUserId!)

        if (linkedUserIds.length > 0) {
          await db
            .delete(invitations)
            .where(
              and(
                eq(invitations.eventId, eventId),
                inArray(invitations.inviteeId, linkedUserIds)
              )
            )
        }
      }

      // Добавляем новых участников
      if (toAdd.length > 0) {
        // Получаем контакты пользователя
        const userContacts = await db
          .select()
          .from(contacts)
          .where(eq(contacts.userId, user.id))

        const userContactIds = new Set(userContacts.map(c => c.id))
        const validToAdd = toAdd.filter(id => userContactIds.has(id))

        for (const contactId of validToAdd) {
          const contact = userContacts.find(c => c.id === contactId)
          if (!contact) continue

          // Создаём запись участника
          const [participant] = await db
            .insert(eventParticipants)
            .values({
              eventId,
              contactId: contact.id,
              status: 'pending'
            })
            .returning()

          participants.push(participant)

          // Если контакт связан с пользователем системы, создаём приглашение
          if (contact.linkedUserId) {
            const [invitation] = await db
              .insert(invitations)
              .values({
                eventId,
                inviterId: user.id,
                inviteeId: contact.linkedUserId,
                status: 'pending'
              })
              .returning()

            createdInvitations.push(invitation)
          }
        }
      }

      // Получаем обновлённый список участников
      participants = await db
        .select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))
    } else {
      // Получаем текущих участников
      participants = await db
        .select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId))
    }

    return {
      success: true,
      event: updatedEvent,
      participants,
      newInvitations: createdInvitations
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error updating event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update event'
    })
  }
})
