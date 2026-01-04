import { db } from '../../../db'
import { invitations, events, eventParticipants, contacts, users } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { getTelegramBot } from '../../../utils/telegram-bot'

/**
 * POST /api/invitations/[id]/respond
 * Принять или отклонить приглашение
 * Обновляет статус приглашения и соответствующего участника события
 * Requirements: 7.3, 7.4
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

    // Получаем ID приглашения из параметров
    const invitationId = parseInt(event.context.params?.id || '')
    if (isNaN(invitationId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID приглашения'
      })
    }

    // Получаем тело запроса
    const body = await readBody(event)
    const { status } = body

    // Валидация статуса
    if (!status || !['accepted', 'declined'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Статус должен быть "accepted" или "declined"'
      })
    }

    // Получаем приглашение
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1)

    if (!invitation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Приглашение не найдено'
      })
    }

    // Проверяем, что приглашение адресовано текущему пользователю
    if (invitation.inviteeId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Это приглашение адресовано другому пользователю'
      })
    }

    // Проверяем, что приглашение ещё не обработано
    if (invitation.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: `Приглашение уже ${invitation.status === 'accepted' ? 'принято' : 'отклонено'}`
      })
    }

    // Получаем событие
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, invitation.eventId))
      .limit(1)

    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено'
      })
    }

    // Проверяем, что событие не отменено
    if (eventData.status === 'cancelled') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Событие было отменено'
      })
    }

    const now = new Date()

    // Обновляем статус приглашения
    // Property 11: Invitation response synchronization
    const [updatedInvitation] = await db
      .update(invitations)
      .set({
        status,
        respondedAt: now
      })
      .where(eq(invitations.id, invitationId))
      .returning()

    // Находим соответствующего участника события и обновляем его статус
    // Участник связан через контакт, где linkedUserId = inviteeId
    const participantContacts = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(eq(contacts.linkedUserId, user.id))

    const contactIds = participantContacts.map(c => c.id)

    let updatedParticipant = null
    if (contactIds.length > 0) {
      // Ищем участника события с одним из контактов
      for (const contactId of contactIds) {
        const [participant] = await db
          .select()
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, invitation.eventId),
              eq(eventParticipants.contactId, contactId)
            )
          )
          .limit(1)

        if (participant) {
          // Обновляем статус участника
          [updatedParticipant] = await db
            .update(eventParticipants)
            .set({
              status,
              respondedAt: now
            })
            .where(eq(eventParticipants.id, participant.id))
            .returning()
          break
        }
      }
    }

    // Отправляем уведомление организатору
    // Requirement 7.5: notify the event organizer when invitation is responded to
    let notificationSent = false
    try {
      const [organizer] = await db
        .select()
        .from(users)
        .where(eq(users.id, eventData.organizerId))
        .limit(1)

      if (organizer?.telegramId) {
        const bot = getTelegramBot()
        const message = formatResponseMessage(
          eventData.title,
          eventData.startDate,
          user.firstName || user.username || 'Пользователь',
          status === 'accepted'
        )

        notificationSent = await bot.sendMessage(organizer.telegramId, message)
      }
    } catch (notificationError) {
      console.error('Error sending response notification:', notificationError)
    }

    return {
      success: true,
      invitation: updatedInvitation,
      participant: updatedParticipant,
      notificationSent
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error responding to invitation:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to respond to invitation'
    })
  }
})

/**
 * Форматирует сообщение об ответе на приглашение
 */
function formatResponseMessage(
  eventTitle: string,
  eventDate: Date,
  responderName: string,
  accepted: boolean
): string {
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const emoji = accepted ? '✅' : '❌'
  const action = accepted ? 'принял(а)' : 'отклонил(а)'

  return `<b>${emoji} Ответ на приглашение</b>

<b>${eventTitle}</b>
📅 ${formattedDate}

<b>${responderName}</b> ${action} приглашение на это событие.`
}
