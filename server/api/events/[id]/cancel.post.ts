import { db } from '../../../db'
import { events, eventParticipants, invitations, contacts, users } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { getTelegramBot } from '../../../utils/telegram-bot'

/**
 * POST /api/events/[id]/cancel
 * Отмена события
 * Установить статус cancelled и отправить уведомления участникам
 * Requirement: 8.5
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
    if (existingEvent.organizerId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Только организатор может отменить событие'
      })
    }

    // Проверяем, что событие ещё не отменено
    if (existingEvent.status === 'cancelled') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Событие уже отменено'
      })
    }

    // Обновляем статус события на cancelled
    const [cancelledEvent] = await db
      .update(events)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId))
      .returning()

    // Получаем участников с информацией о связанных пользователях
    const participants = await db
      .select({
        participant: eventParticipants,
        contact: contacts
      })
      .from(eventParticipants)
      .leftJoin(contacts, eq(eventParticipants.contactId, contacts.id))
      .where(eq(eventParticipants.eventId, eventId))

    // Отправляем уведомления связанным пользователям
    // Requirement 8.5: notify all participants when event is cancelled
    const notificationResults: { userId: number; success: boolean; error?: string }[] = []

    try {
      const bot = getTelegramBot()

      for (const p of participants) {
        if (p.contact?.linkedUserId) {
          // Получаем данные связанного пользователя
          const [linkedUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, p.contact.linkedUserId))
            .limit(1)

          if (linkedUser?.telegramId) {
            const message = formatCancellationMessage(
              existingEvent.title,
              existingEvent.startDate,
              user.firstName || user.username || 'Организатор'
            )

            const success = await bot.sendMessage(linkedUser.telegramId, message)
            
            notificationResults.push({
              userId: linkedUser.id,
              success
            })
          }
        }
      }
    } catch (notificationError) {
      // Логируем ошибку, но не прерываем операцию
      console.error('Error sending cancellation notifications:', notificationError)
    }

    // Обновляем статус приглашений на cancelled (опционально)
    await db
      .update(invitations)
      .set({ status: 'declined' })
      .where(
        and(
          eq(invitations.eventId, eventId),
          eq(invitations.status, 'pending')
        )
      )

    return {
      success: true,
      event: cancelledEvent,
      notificationsSent: notificationResults.filter(r => r.success).length,
      notificationsFailed: notificationResults.filter(r => !r.success).length
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error cancelling event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to cancel event'
    })
  }
})

/**
 * Форматирует сообщение об отмене события
 */
function formatCancellationMessage(
  eventTitle: string,
  eventDate: Date,
  organizerName: string
): string {
  const formattedDate = eventDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `<b>❌ Событие отменено</b>

<b>${eventTitle}</b>
📅 ${formattedDate}

Организатор <b>${organizerName}</b> отменил это событие.`
}
