import { db, schema } from '../../db'
import { eq } from 'drizzle-orm'

/**
 * GET /api/gamification/achievements
 * Получить все достижения с информацией о разблокировке для пользователя
 * 
 * Query параметры:
 * - userId: ID пользователя
 * 
 * Возвращает массив достижений с полями:
 * - id: ID достижения
 * - code: Код достижения
 * - name: Название
 * - description: Описание
 * - icon: Иконка
 * - xpReward: Награда в XP
 * - criteria: Критерии разблокировки
 * - unlocked: Разблокировано ли достижение
 * - unlockedAt: Дата разблокировки (если разблокировано)
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
      .from(schema.users)
      .where(eq(schema.users.telegramId, String(telegramId)))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }

    // Получить все достижения
    const allAchievements = await db
      .select()
      .from(schema.achievements)
      .orderBy(schema.achievements.id)

    // Получить разблокированные достижения пользователя (используем database user.id)
    const userAchievements = await db
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, user.id))

    // Создать map разблокированных достижений
    const unlockedMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
    )

    // Объединить данные
    const achievementsWithStatus = allAchievements.map(achievement => ({
      id: achievement.id,
      code: achievement.code,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xpReward,
      criteria: achievement.criteria,
      unlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null
    }))

    return {
      success: true,
      achievements: achievementsWithStatus
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Ошибка при получении достижений:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось получить достижения'
    })
  }
})
