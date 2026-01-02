import { db, schema } from '../../../db'
import { reminders, contacts } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { calculateNextReminderDate } from '../../../utils/reminders'
import { updateStreak, awardXP, checkAchievements } from '../../../utils/gamification'

/**
 * POST /api/reminders/:id/complete
 * Отметить напоминание как выполненное
 * 
 * Параметры маршрута:
 * - id: ID напоминания
 * 
 * Действия:
 * 1. Отметить напоминание как выполненное
 * 2. Обновить lastContactDate контакта на сегодня
 * 3. Рассчитать и обновить nextReminderDate контакта
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить ID напоминания из параметров маршрута
    const reminderId = parseInt(event.context.params?.id || '0')
    
    if (!reminderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid reminder ID'
      })
    }

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

    // Получить напоминание и проверить, что оно принадлежит пользователю (используем database user.id)
    const [reminder] = await db
      .select()
      .from(reminders)
      .where(
        and(
          eq(reminders.id, reminderId),
          eq(reminders.userId, user.id)
        )
      )
      .limit(1)

    if (!reminder) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Напоминание не найдено'
      })
    }

    // Проверить, что напоминание еще не выполнено
    if (reminder.completed) {
      return {
        success: true,
        message: 'Напоминание уже было выполнено',
        reminder
      }
    }

    // Текущая дата и время
    const now = new Date()

    // Обновить напоминание - отметить как выполненное
    const [updatedReminder] = await db
      .update(reminders)
      .set({
        completed: true,
        completedAt: now
      })
      .where(eq(reminders.id, reminderId))
      .returning()

    // Получить связанный контакт
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, reminder.contactId))
      .limit(1)

    if (!contact) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Контакт не найден'
      })
    }

    // Обновить контакт - установить lastContactDate на сегодня
    // и рассчитать nextReminderDate
    const updatedContact = {
      ...contact,
      lastContactDate: now
    }
    
    const nextReminderDate = calculateNextReminderDate(updatedContact)

    await db
      .update(contacts)
      .set({
        lastContactDate: now,
        nextReminderDate: nextReminderDate,
        updatedAt: now
      })
      .where(eq(contacts.id, contact.id))

    // Gamification: Update streak, award XP, and check achievements
    await updateStreak(user.id)
    const userAfterXP = await awardXP(user.id, 'REMINDER_COMPLETED')
    const newAchievements = await checkAchievements(user.id)

    // Get updated user data from database
    const [updatedUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, user.id))
      .limit(1)

    // Get achievement details for unlocked achievements
    const unlockedAchievements = []
    if (newAchievements.length > 0) {
      for (const userAchievement of newAchievements) {
        const [achievement] = await db
          .select()
          .from(schema.achievements)
          .where(eq(schema.achievements.id, userAchievement.achievementId))
          .limit(1)
        
        if (achievement) {
          unlockedAchievements.push({
            id: achievement.id,
            code: achievement.code,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            xpReward: achievement.xpReward
          })
        }
      }
    }

    return {
      success: true,
      message: 'Напоминание успешно выполнено',
      reminder: updatedReminder,
      contact: {
        ...contact,
        lastContactDate: now,
        nextReminderDate: nextReminderDate
      },
      xpEarned: 20,
      newLevel: updatedUser?.level || user.level,
      newStreak: updatedUser?.currentStreak || user.currentStreak,
      unlockedAchievements
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    console.error('Ошибка при завершении напоминания:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось завершить напоминание'
    })
  }
})
