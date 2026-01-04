import { db } from '../../db'
import { users, notificationSettings } from '../../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Valid reminder time options in minutes
 */
const VALID_REMINDER_MINUTES = [15, 30, 60, 1440] // 15min, 30min, 1hour, 1day

/**
 * PUT /api/notifications/settings
 * Update notification settings for the current user
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

    // Parse request body
    const body = await readBody(event)

    // Validate defaultReminderMinutes if provided
    if (body.defaultReminderMinutes !== undefined) {
      if (!VALID_REMINDER_MINUTES.includes(body.defaultReminderMinutes)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Недопустимое время напоминания. Допустимые значения: ${VALID_REMINDER_MINUTES.join(', ')} минут`
        })
      }
    }

    // Check if settings exist
    const [existingSettings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, user.id))
      .limit(1)

    const now = new Date()

    if (existingSettings) {
      // Update existing settings (only update fields that are provided)
      const updateData: Partial<typeof notificationSettings.$inferInsert> = {
        updatedAt: now
      }

      if (body.eventReminders !== undefined) {
        updateData.eventReminders = Boolean(body.eventReminders)
      }
      if (body.invitationNotifications !== undefined) {
        updateData.invitationNotifications = Boolean(body.invitationNotifications)
      }
      if (body.connectionNotifications !== undefined) {
        updateData.connectionNotifications = Boolean(body.connectionNotifications)
      }
      if (body.reminderNotifications !== undefined) {
        updateData.reminderNotifications = Boolean(body.reminderNotifications)
      }
      if (body.defaultReminderMinutes !== undefined) {
        updateData.defaultReminderMinutes = body.defaultReminderMinutes
      }

      const [updated] = await db
        .update(notificationSettings)
        .set(updateData)
        .where(eq(notificationSettings.userId, user.id))
        .returning()

      return {
        success: true,
        settings: {
          eventReminders: updated.eventReminders,
          invitationNotifications: updated.invitationNotifications,
          connectionNotifications: updated.connectionNotifications,
          reminderNotifications: updated.reminderNotifications,
          defaultReminderMinutes: updated.defaultReminderMinutes
        }
      }
    } else {
      // Create new settings
      const [created] = await db
        .insert(notificationSettings)
        .values({
          userId: user.id,
          eventReminders: body.eventReminders ?? true,
          invitationNotifications: body.invitationNotifications ?? true,
          connectionNotifications: body.connectionNotifications ?? true,
          reminderNotifications: body.reminderNotifications ?? true,
          defaultReminderMinutes: body.defaultReminderMinutes ?? 60,
          createdAt: now,
          updatedAt: now
        })
        .returning()

      return {
        success: true,
        settings: {
          eventReminders: created.eventReminders,
          invitationNotifications: created.invitationNotifications,
          connectionNotifications: created.connectionNotifications,
          reminderNotifications: created.reminderNotifications,
          defaultReminderMinutes: created.defaultReminderMinutes
        }
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('[API] Error updating notification settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update notification settings'
    })
  }
})
