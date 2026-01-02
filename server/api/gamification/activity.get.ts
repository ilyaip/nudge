import { aggregateActivity, type ActivityPeriod } from '../../utils/activity'

/**
 * GET /api/gamification/activity
 * Получить агрегированные данные активности пользователя
 * 
 * Query параметры:
 * - period: 'week' или 'month' (по умолчанию 'week')
 * 
 * Возвращает:
 * - period: Период агрегации
 * - startDate: Начальная дата периода (YYYY-MM-DD)
 * - endDate: Конечная дата периода (YYYY-MM-DD)
 * - activities: Массив данных активности по дням
 *   - date: Дата (YYYY-MM-DD)
 *   - completedReminders: Количество завершенных напоминаний
 *   - xpEarned: Заработанный XP
 * - totalCompleted: Общее количество завершенных напоминаний за период
 * - totalXP: Общий XP за период
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить userId из Telegram контекста
    const telegramUser = event.context.telegramUser
    const userId = telegramUser?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Telegram user not found'
      })
    }

    // Получить параметр period из query
    const query = getQuery(event)
    const period = (query.period as ActivityPeriod) || 'week'

    // Валидация параметра period
    if (period !== 'week' && period !== 'month') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Неверный параметр period. Допустимые значения: week, month'
      })
    }

    // Получить агрегированные данные активности
    const activityData = await aggregateActivity(userId, period)

    return {
      success: true,
      data: activityData
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Ошибка при получении данных активности:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось получить данные активности'
    })
  }
})
