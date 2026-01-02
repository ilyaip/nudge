import { db, schema } from '../../db'
import { eq } from 'drizzle-orm'
import { calculateLevel, getXPForNextLevel } from '../../utils/gamification'

/**
 * GET /api/gamification/stats
 * Получить статистику геймификации пользователя
 * 
 * Query параметры:
 * - userId: ID пользователя
 * 
 * Возвращает:
 * - currentStreak: Текущий стрик
 * - longestStreak: Самый длинный стрик
 * - totalXP: Общее количество XP
 * - level: Текущий уровень
 * - xpForNextLevel: XP необходимое для следующего уровня
 * - xpProgress: Прогресс к следующему уровню (0-1)
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

    // Получить данные пользователя
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }

    // Рассчитать прогресс к следующему уровню
    const currentLevelXP = ((user.level - 1) * (user.level - 1)) * 100
    const nextLevelXP = getXPForNextLevel(user.level)
    const xpInCurrentLevel = user.totalXP - currentLevelXP
    const xpNeededForLevel = nextLevelXP - currentLevelXP
    const xpProgress = xpNeededForLevel > 0 ? xpInCurrentLevel / xpNeededForLevel : 1

    return {
      success: true,
      stats: {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalXP: user.totalXP,
        level: user.level,
        xpForNextLevel: nextLevelXP,
        xpProgress: Math.min(1, Math.max(0, xpProgress)),
        lastActivityDate: user.lastActivityDate
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Ошибка при получении статистики геймификации:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось получить статистику геймификации'
    })
  }
})
