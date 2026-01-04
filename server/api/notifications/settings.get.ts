import { db } from '../../db'
import { users, notificationSettings } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/notifications/settings
 * Get notification settings for the current user
 * Requirements: 11.4, 12.1, 12.2
 */
export default defineEventHandler(async (event) => {
  try {
    // Get Telegram ID from context
    const telegramUser = event.context.telegramUser
    const telegramId = telegramUser?.id

    if (!telegramId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Telegram user not found'
      })
    }

    // Find user by Telegram ID
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

    // Get notification settings
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, user.id))
      .limit(1)

    // If no settings exist, return defaults
    if (!settings) {
      return {
        success: true,
        settings: {
          eventReminders: true,
          invitationNotifications: true,
          connectionNotifications: true,
          reminderNotifications: true,
          defaultReminderMinutes: 60
        }
      }
    }

    return {
      success: true,
      settings: {
        eventReminders: settings.eventReminders,
        invitationNotifications: settings.invitationNotifications,
        connectionNotifications: settings.connectionNotifications,
        reminderNotifications: settings.reminderNotifications,
        defaultReminderMinutes: settings.defaultReminderMinutes
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('[API] Error fetching notification settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notification settings'
    })
  }
})
