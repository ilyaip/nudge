/**
 * NotificationService - Service for sending notifications via Telegram bot
 * Handles event reminders, invitations, responses, cancellations, and connection notifications
 * Requirements: 11.1, 11.6
 */

import { db } from '../db'
import { users, events, notificationSettings } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { Event, User, NotificationSetting } from '../db/schema'

/**
 * Result of a notification send attempt
 */
export interface NotificationResult {
  success: boolean
  telegramId: string
  error?: string
  retryCount: number
}

/**
 * Event type icons for messages
 */
const EVENT_TYPE_ICONS: Record<string, string> = {
  meeting: '🤝',
  call: '📞',
  trip: '✈️',
  other: '📅'
}

/**
 * NotificationService class for sending various types of notifications
 * Implements retry logic with exponential backoff (Requirement 11.6)
 */
export class NotificationService {
  private botToken: string
  private apiUrl: string
  private maxRetries: number = 3
  private baseRetryDelay: number = 1000 // 1 second

  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || ''
    if (!this.botToken) {
      console.warn('[NotificationService] TELEGRAM_BOT_TOKEN not set')
    }
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`
  }

  /**
   * Send a message via Telegram Bot API
   */
  private async sendTelegramMessage(
    telegramId: string,
    message: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML'
  ): Promise<boolean> {
    if (!this.botToken) {
      console.error('[NotificationService] Bot token not configured')
      return false
    }

    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text: message,
          parse_mode: parseMode
        })
      })

      const data = await response.json()
      if (!data.ok) {
        console.error(`[NotificationService] Telegram API error: ${data.description}`)
        return false
      }
      return true
    } catch (error) {
      console.error('[NotificationService] Error sending message:', error)
      return false
    }
  }

  /**
   * Retry logic with exponential backoff
   * Requirement 11.6: retry up to 3 times before marking as failed
   */
  private async retryWithBackoff(
    fn: () => Promise<boolean>
  ): Promise<{ success: boolean; retryCount: number }> {
    let retryCount = 0

    while (retryCount < this.maxRetries) {
      const success = await fn()
      if (success) {
        return { success: true, retryCount }
      }

      retryCount++
      if (retryCount < this.maxRetries) {
        const delay = this.baseRetryDelay * Math.pow(2, retryCount - 1)
        console.log(`[NotificationService] Retry ${retryCount}/${this.maxRetries} in ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return { success: false, retryCount }
  }

  /**
   * Check if user has notifications enabled for a specific type
   */
  private async checkUserNotificationPreference(
    userId: number,
    notificationType: 'eventReminders' | 'invitationNotifications' | 'connectionNotifications' | 'reminderNotifications'
  ): Promise<boolean> {
    try {
      const settings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId))
        .limit(1)

      // If no settings exist, default to enabled
      if (settings.length === 0) {
        return true
      }

      return settings[0][notificationType] ?? true
    } catch (error) {
      console.error('[NotificationService] Error checking notification preferences:', error)
      return true // Default to enabled on error
    }
  }

  /**
   * Get user's Telegram ID by user ID
   */
  private async getUserTelegramId(userId: number): Promise<string | null> {
    try {
      const user = await db
        .select({ telegramId: users.telegramId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      return user.length > 0 ? user[0].telegramId : null
    } catch (error) {
      console.error('[NotificationService] Error getting user Telegram ID:', error)
      return null
    }
  }

  /**
   * Format date for display in messages
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get event type icon
   */
  private getEventTypeIcon(type: string): string {
    return EVENT_TYPE_ICONS[type] || EVENT_TYPE_ICONS.other
  }

  /**
   * Send event reminder notification
   * Requirement 11.2: send event reminders at configurable time before event
   */
  async sendEventReminder(userId: number, event: Event): Promise<NotificationResult> {
    const telegramId = await this.getUserTelegramId(userId)
    if (!telegramId) {
      return { success: false, telegramId: '', error: 'User not found', retryCount: 0 }
    }

    // Check user preferences (Requirement 12.4)
    const enabled = await this.checkUserNotificationPreference(userId, 'eventReminders')
    if (!enabled) {
      console.log(`[NotificationService] Event reminders disabled for user ${userId}`)
      return { success: true, telegramId, retryCount: 0 } // Consider as success - user opted out
    }

    const icon = this.getEventTypeIcon(event.type)
    const eventType = event.type === 'other' && event.customType ? event.customType : event.type
    const message = `${icon} <b>Напоминание о событии</b>\n\n` +
      `<b>${event.title}</b>\n` +
      `📅 ${this.formatDate(event.startDate)}\n` +
      `⏱ Продолжительность: ${event.duration} мин.\n` +
      (event.description ? `\n📝 ${event.description}` : '')

    const { success, retryCount } = await this.retryWithBackoff(
      () => this.sendTelegramMessage(telegramId, message)
    )

    return {
      success,
      telegramId,
      retryCount,
      error: success ? undefined : 'Failed after max retries'
    }
  }

  /**
   * Send invitation notification
   * Requirement 7.2: notify user when invitation is received
   */
  async sendInvitation(
    inviteeId: number,
    event: Event,
    inviter: Pick<User, 'firstName' | 'lastName' | 'username'>
  ): Promise<NotificationResult> {
    const telegramId = await this.getUserTelegramId(inviteeId)
    if (!telegramId) {
      return { success: false, telegramId: '', error: 'User not found', retryCount: 0 }
    }

    // Check user preferences
    const enabled = await this.checkUserNotificationPreference(inviteeId, 'invitationNotifications')
    if (!enabled) {
      console.log(`[NotificationService] Invitation notifications disabled for user ${inviteeId}`)
      return { success: true, telegramId, retryCount: 0 }
    }

    const inviterName = [inviter.firstName, inviter.lastName].filter(Boolean).join(' ') || inviter.username || 'Пользователь'
    const icon = this.getEventTypeIcon(event.type)
    
    const message = `📨 <b>Новое приглашение</b>\n\n` +
      `${inviterName} приглашает вас на событие:\n\n` +
      `${icon} <b>${event.title}</b>\n` +
      `📅 ${this.formatDate(event.startDate)}\n` +
      `⏱ Продолжительность: ${event.duration} мин.\n` +
      (event.description ? `\n📝 ${event.description}\n` : '') +
      `\n✅ Откройте приложение, чтобы принять или отклонить приглашение.`

    const { success, retryCount } = await this.retryWithBackoff(
      () => this.sendTelegramMessage(telegramId, message)
    )

    return {
      success,
      telegramId,
      retryCount,
      error: success ? undefined : 'Failed after max retries'
    }
  }

  /**
   * Send invitation response notification to organizer
   * Requirement 7.5: notify event organizer when invitation is responded to
   */
  async sendInvitationResponse(
    organizerId: number,
    event: Event,
    responder: Pick<User, 'firstName' | 'lastName' | 'username'>,
    accepted: boolean
  ): Promise<NotificationResult> {
    const telegramId = await this.getUserTelegramId(organizerId)
    if (!telegramId) {
      return { success: false, telegramId: '', error: 'User not found', retryCount: 0 }
    }

    // Check user preferences
    const enabled = await this.checkUserNotificationPreference(organizerId, 'invitationNotifications')
    if (!enabled) {
      console.log(`[NotificationService] Invitation notifications disabled for user ${organizerId}`)
      return { success: true, telegramId, retryCount: 0 }
    }

    const responderName = [responder.firstName, responder.lastName].filter(Boolean).join(' ') || responder.username || 'Пользователь'
    const statusIcon = accepted ? '✅' : '❌'
    const statusText = accepted ? 'принял(а)' : 'отклонил(а)'
    
    const message = `${statusIcon} <b>Ответ на приглашение</b>\n\n` +
      `${responderName} ${statusText} приглашение на событие:\n\n` +
      `<b>${event.title}</b>\n` +
      `📅 ${this.formatDate(event.startDate)}`

    const { success, retryCount } = await this.retryWithBackoff(
      () => this.sendTelegramMessage(telegramId, message)
    )

    return {
      success,
      telegramId,
      retryCount,
      error: success ? undefined : 'Failed after max retries'
    }
  }

  /**
   * Send event cancellation notification
   * Requirement 8.5: notify all participants when event is cancelled
   */
  async sendEventCancellation(
    participantUserId: number,
    event: Event
  ): Promise<NotificationResult> {
    const telegramId = await this.getUserTelegramId(participantUserId)
    if (!telegramId) {
      return { success: false, telegramId: '', error: 'User not found', retryCount: 0 }
    }

    // Check user preferences
    const enabled = await this.checkUserNotificationPreference(participantUserId, 'eventReminders')
    if (!enabled) {
      console.log(`[NotificationService] Event notifications disabled for user ${participantUserId}`)
      return { success: true, telegramId, retryCount: 0 }
    }

    const icon = this.getEventTypeIcon(event.type)
    
    const message = `🚫 <b>Событие отменено</b>\n\n` +
      `${icon} <b>${event.title}</b>\n` +
      `📅 ${this.formatDate(event.startDate)}\n\n` +
      `Организатор отменил это событие.`

    const { success, retryCount } = await this.retryWithBackoff(
      () => this.sendTelegramMessage(telegramId, message)
    )

    return {
      success,
      telegramId,
      retryCount,
      error: success ? undefined : 'Failed after max retries'
    }
  }

  /**
   * Send connection notification when someone adds the user as a contact
   * Requirement 2.2: notify user when added by someone
   */
  async sendConnectionNotification(
    userId: number,
    addedBy: Pick<User, 'firstName' | 'lastName' | 'username'>
  ): Promise<NotificationResult> {
    const telegramId = await this.getUserTelegramId(userId)
    if (!telegramId) {
      return { success: false, telegramId: '', error: 'User not found', retryCount: 0 }
    }

    // Check user preferences
    const enabled = await this.checkUserNotificationPreference(userId, 'connectionNotifications')
    if (!enabled) {
      console.log(`[NotificationService] Connection notifications disabled for user ${userId}`)
      return { success: true, telegramId, retryCount: 0 }
    }

    const addedByName = [addedBy.firstName, addedBy.lastName].filter(Boolean).join(' ') || addedBy.username || 'Пользователь'
    
    const message = `👋 <b>Новая связь</b>\n\n` +
      `${addedByName} добавил(а) вас в свои контакты!\n\n` +
      `Откройте приложение, чтобы добавить в ответ и установить взаимную связь.`

    const { success, retryCount } = await this.retryWithBackoff(
      () => this.sendTelegramMessage(telegramId, message)
    )

    return {
      success,
      telegramId,
      retryCount,
      error: success ? undefined : 'Failed after max retries'
    }
  }
}

/**
 * Get singleton instance of NotificationService
 */
let notificationServiceInstance: NotificationService | null = null

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService()
  }
  return notificationServiceInstance
}

/**
 * Calculate reminder time based on event start date and reminder minutes
 * Requirement 11.2: send event reminders at configurable time before event
 * Property 18: reminder notification scheduled for (startDate - M minutes)
 */
export function calculateReminderTime(startDate: Date, reminderMinutes: number): Date {
  const reminderTime = new Date(startDate)
  reminderTime.setMinutes(reminderTime.getMinutes() - reminderMinutes)
  return reminderTime
}
