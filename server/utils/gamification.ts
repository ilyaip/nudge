import { db, schema } from '../db'
import { eq } from 'drizzle-orm'
import type { User } from '../db/schema'

/**
 * Типы действий для начисления XP
 */
export const XP_REWARDS = {
  CONTACT_ADDED: 10,
  REMINDER_COMPLETED: 20,
  STREAK_MAINTAINED: 5,
  ACHIEVEMENT_UNLOCKED: 50
} as const

export type ActionType = keyof typeof XP_REWARDS

/**
 * Обновляет стрик пользователя на основе последней активности
 * 
 * @param userId - ID пользователя
 * @param completedToday - Флаг, указывающий, что активность выполнена сегодня
 * @returns Обновленные данные пользователя
 */
export async function updateStreak(userId: number, completedToday: boolean = true): Promise<User> {
  // Получаем текущие данные пользователя
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (!user) {
    throw new Error(`Пользователь с ID ${userId} не найден`)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const lastActivity = user.lastActivityDate ? new Date(user.lastActivityDate) : null
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0)
  }

  let newStreak = user.currentStreak
  let newLongestStreak = user.longestStreak

  if (!lastActivity) {
    // Первая активность пользователя
    newStreak = 1
    newLongestStreak = Math.max(1, user.longestStreak)
  } else {
    const daysSinceLastActivity = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastActivity === 0) {
      // Активность уже была сегодня - стрик не меняется
      newStreak = user.currentStreak
    } else if (daysSinceLastActivity === 1) {
      // Последовательный день - увеличиваем стрик
      newStreak = user.currentStreak + 1
      newLongestStreak = Math.max(newStreak, user.longestStreak)
    } else {
      // Пропущены дни - стрик сбрасывается
      newStreak = 1
    }
  }

  // Обновляем данные пользователя в базе
  const [updatedUser] = await db
    .update(schema.users)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: today,
      updatedAt: new Date()
    })
    .where(eq(schema.users.id, userId))
    .returning()

  return updatedUser
}

/**
 * Рассчитывает уровень пользователя на основе общего XP
 * Формула: level = floor(sqrt(totalXP / 100)) + 1
 * 
 * @param totalXP - Общее количество XP пользователя
 * @returns Уровень пользователя
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP < 0) {
    return 1
  }
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

/**
 * Рассчитывает количество XP, необходимое для следующего уровня
 * 
 * @param currentLevel - Текущий уровень пользователя
 * @returns Количество XP для следующего уровня
 */
export function getXPForNextLevel(currentLevel: number): number {
  return (currentLevel * currentLevel) * 100
}

/**
 * Начисляет XP пользователю за выполненное действие
 * 
 * @param userId - ID пользователя
 * @param action - Тип действия
 * @param metadata - Дополнительные данные о действии
 * @returns Обновленные данные пользователя
 */
export async function awardXP(
  userId: number,
  action: ActionType,
  metadata?: Record<string, any>
): Promise<User> {
  // Получаем текущие данные пользователя
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (!user) {
    throw new Error(`Пользователь с ID ${userId} не найден`)
  }

  // Получаем количество XP за действие
  const xpAmount = XP_REWARDS[action]
  const newTotalXP = user.totalXP + xpAmount
  const newLevel = calculateLevel(newTotalXP)

  // Обновляем данные пользователя
  const [updatedUser] = await db
    .update(schema.users)
    .set({
      totalXP: newTotalXP,
      level: newLevel,
      updatedAt: new Date()
    })
    .where(eq(schema.users.id, userId))
    .returning()

  // Логируем активность
  await logActivity(userId, action, xpAmount, metadata)

  return updatedUser
}

/**
 * Логирует активность пользователя в базу данных
 * 
 * @param userId - ID пользователя
 * @param action - Тип действия
 * @param xpAwarded - Количество начисленного XP
 * @param metadata - Дополнительные данные о действии
 */
export async function logActivity(
  userId: number,
  action: ActionType,
  xpAwarded: number,
  metadata?: Record<string, any>
): Promise<void> {
  await db.insert(schema.activityLogs).values({
    userId,
    action,
    xpAwarded,
    metadata: metadata || null
  })
}

/**
 * Проверяет, соответствует ли пользователь критериям достижения
 * 
 * @param userId - ID пользователя
 * @param achievement - Достижение для проверки
 * @returns true, если критерии выполнены
 */
async function meetsAchievementCriteria(userId: number, achievement: any): Promise<boolean> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)

  if (!user) {
    return false
  }

  const criteria = achievement.criteria as Record<string, any>

  // Проверяем различные типы критериев
  if (criteria.minStreak !== undefined && user.currentStreak < criteria.minStreak) {
    return false
  }

  if (criteria.minLevel !== undefined && user.level < criteria.minLevel) {
    return false
  }

  if (criteria.minXP !== undefined && user.totalXP < criteria.minXP) {
    return false
  }

  if (criteria.minContacts !== undefined) {
    const contacts = await db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.userId, userId))
    
    if (contacts.length < criteria.minContacts) {
      return false
    }
  }

  if (criteria.minRemindersCompleted !== undefined) {
    const completedReminders = await db
      .select()
      .from(schema.reminders)
      .where(eq(schema.reminders.userId, userId))
      .where(eq(schema.reminders.completed, true))
    
    if (completedReminders.length < criteria.minRemindersCompleted) {
      return false
    }
  }

  return true
}

/**
 * Разблокирует достижение для пользователя
 * 
 * @param userId - ID пользователя
 * @param achievementId - ID достижения
 * @returns Данные о разблокированном достижении
 */
export async function unlockAchievement(userId: number, achievementId: number) {
  // Проверяем, не разблокировано ли уже достижение
  const existing = await db
    .select()
    .from(schema.userAchievements)
    .where(eq(schema.userAchievements.userId, userId))
    .where(eq(schema.userAchievements.achievementId, achievementId))
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  // Получаем информацию о достижении
  const [achievement] = await db
    .select()
    .from(schema.achievements)
    .where(eq(schema.achievements.id, achievementId))
    .limit(1)

  if (!achievement) {
    throw new Error(`Достижение с ID ${achievementId} не найдено`)
  }

  // Разблокируем достижение
  const [userAchievement] = await db
    .insert(schema.userAchievements)
    .values({
      userId,
      achievementId
    })
    .returning()

  // Начисляем XP за достижение
  await awardXP(userId, 'ACHIEVEMENT_UNLOCKED', {
    achievementId,
    achievementCode: achievement.code
  })

  return userAchievement
}

/**
 * Проверяет все достижения для пользователя и разблокирует подходящие
 * 
 * @param userId - ID пользователя
 * @returns Массив разблокированных достижений
 */
export async function checkAchievements(userId: number) {
  // Получаем все достижения
  const allAchievements = await db
    .select()
    .from(schema.achievements)

  // Получаем уже разблокированные достижения
  const unlockedAchievements = await db
    .select()
    .from(schema.userAchievements)
    .where(eq(schema.userAchievements.userId, userId))

  const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId))

  // Проверяем каждое достижение
  const newlyUnlocked = []
  
  for (const achievement of allAchievements) {
    // Пропускаем уже разблокированные
    if (unlockedIds.has(achievement.id)) {
      continue
    }

    // Проверяем критерии
    const meets = await meetsAchievementCriteria(userId, achievement)
    
    if (meets) {
      const unlocked = await unlockAchievement(userId, achievement.id)
      newlyUnlocked.push(unlocked)
    }
  }

  return newlyUnlocked
}


