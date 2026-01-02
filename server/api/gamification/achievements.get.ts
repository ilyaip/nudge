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
    // Получить userId из query параметров
    const query = getQuery(event)
    const userId = query.userId ? parseInt(query.userId as string) : null

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Отсутствует параметр userId'
      })
    }

    // Проверить существование пользователя
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

    // Получить все достижения
    const allAchievements = await db
      .select()
      .from(schema.achievements)
      .orderBy(schema.achievements.id)

    // Получить разблокированные достижения пользователя
    const userAchievements = await db
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, userId))

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
