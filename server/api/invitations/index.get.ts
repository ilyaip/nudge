import { db } from '../../db'
import { invitations, events, users } from '../../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * GET /api/invitations
 * Список ожидающих приглашений для текущего пользователя
 * Включает детали события и информацию о пригласившем
 * Requirement: 7.1
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
    const status = query.status as string | undefined
    const pendingOnly = query.pending === 'true'

    // Строим условия запроса
    // Property 12: Pending invitations query - inviteeId equals user's id
    const conditions: any[] = [eq(invitations.inviteeId, user.id)]

    // Фильтр по статусу
    if (status) {
      if (!['pending', 'accepted', 'declined'].includes(status)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Недопустимый статус. Допустимые значения: pending, accepted, declined'
        })
      }
      conditions.push(eq(invitations.status, status))
    }

    // Фильтр только ожидающие (по умолчанию)
    if (pendingOnly || !status) {
      conditions.push(eq(invitations.status, 'pending'))
    }

    // Получаем приглашения с деталями события и пригласившего
    const invitationsData = await db
      .select({
        invitation: invitations,
        event: events,
        inviter: users
      })
      .from(invitations)
      .leftJoin(events, eq(invitations.eventId, events.id))
      .leftJoin(users, eq(invitations.inviterId, users.id))
      .where(and(...conditions))
      .orderBy(invitations.createdAt)

    // Форматируем ответ
    const formattedInvitations = invitationsData.map(item => ({
      id: item.invitation.id,
      status: item.invitation.status,
      respondedAt: item.invitation.respondedAt,
      createdAt: item.invitation.createdAt,
      event: item.event ? {
        id: item.event.id,
        title: item.event.title,
        type: item.event.type,
        customType: item.event.customType,
        description: item.event.description,
        startDate: item.event.startDate,
        endDate: item.event.endDate,
        duration: item.event.duration,
        status: item.event.status
      } : null,
      inviter: item.inviter ? {
        id: item.inviter.id,
        firstName: item.inviter.firstName,
        lastName: item.inviter.lastName,
        username: item.inviter.username
      } : null
    }))

    return {
      success: true,
      invitations: formattedInvitations
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching invitations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch invitations'
    })
  }
})
