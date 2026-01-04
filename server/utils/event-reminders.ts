/**
 * Event Reminder Scheduler
 * Calculates reminder times based on event settings and schedules notifications
 * Requirement 11.2: send event reminders at configurable time before event
 */

import { db } from '../db'
import { events, eventParticipants, contacts, users, notificationSettings } from '../db/schema'
import { eq, and, gte, lte, isNull, or } from 'drizzle-orm'
import { getNotificationService, calculateReminderTime } from './notifications'
import type { Event, User } from '../db/schema'

/**
 * Interface for scheduled reminder
 */
export interface ScheduledReminder {
  eventId: number
  userId: number
  reminderTime: Date
  event: Event
}

/**
 * Interface for reminder check result
 */
export interface ReminderCheckResult {
  checked: number
  sent: number
  failed: number
  skipped: number
}

/**
 * Get events that need reminders sent
 * Finds events where:
 * - Status is 'scheduled'
 * - Reminder time (startDate - reminderMinutes) is now or in the past
 * - Event hasn't started yet
 */
export async function getEventsNeedingReminders(now: Date = new Date()): Promise<Event[]> {
  try {
    // Get all scheduled events that haven't started yet
    const scheduledEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.status, 'scheduled'),
          gte(events.startDate, now) // Event hasn't started yet
        )
      )

    // Filter events where reminder time has passed
    const eventsNeedingReminders = scheduledEvents.filter(event => {
      const reminderTime = calculateReminderTime(event.startDate, event.reminderMinutes)
      return reminderTime <= now
    })

    return eventsNeedingReminders
  } catch (error) {
    console.error('[Event Reminders] Error getting events needing reminders:', error)
    return []
  }
}

/**
 * Get all users who should receive a reminder for an event
 * Includes: organizer and all accepted participants (linked users only)
 */
export async function getEventReminderRecipients(eventId: number): Promise<number[]> {
  try {
    // Get the event to find the organizer
    const event = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (event.length === 0) {
      return []
    }

    const recipients: number[] = [event[0].organizerId]

    // Get accepted participants who are linked users
    const participants = await db
      .select({
        linkedUserId: contacts.linkedUserId
      })
      .from(eventParticipants)
      .innerJoin(contacts, eq(eventParticipants.contactId, contacts.id))
      .where(
        and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.status, 'accepted')
        )
      )

    // Add linked user IDs (only those who are in the system)
    for (const participant of participants) {
      if (participant.linkedUserId && !recipients.includes(participant.linkedUserId)) {
        recipients.push(participant.linkedUserId)
      }
    }

    return recipients
  } catch (error) {
    console.error('[Event Reminders] Error getting reminder recipients:', error)
    return []
  }
}

/**
 * Track which reminders have been sent to avoid duplicates
 * Uses a simple in-memory cache (in production, this should be persisted)
 */
const sentReminders = new Map<string, Date>()

/**
 * Generate a unique key for a reminder
 */
function getReminderKey(eventId: number, userId: number): string {
  return `${eventId}-${userId}`
}

/**
 * Check if a reminder has already been sent
 */
export function hasReminderBeenSent(eventId: number, userId: number): boolean {
  const key = getReminderKey(eventId, userId)
  return sentReminders.has(key)
}

/**
 * Mark a reminder as sent
 */
export function markReminderAsSent(eventId: number, userId: number): void {
  const key = getReminderKey(eventId, userId)
  sentReminders.set(key, new Date())
}

/**
 * Clear old sent reminders (cleanup for events that have passed)
 */
export function clearOldReminders(olderThan: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): number {
  let cleared = 0
  for (const [key, sentAt] of sentReminders.entries()) {
    if (sentAt < olderThan) {
      sentReminders.delete(key)
      cleared++
    }
  }
  return cleared
}

/**
 * Process event reminders
 * Main function that checks for events needing reminders and sends them
 */
export async function processEventReminders(now: Date = new Date()): Promise<ReminderCheckResult> {
  const result: ReminderCheckResult = {
    checked: 0,
    sent: 0,
    failed: 0,
    skipped: 0
  }

  try {
    // Check if events table exists
    const tableExists = await checkEventsTableExists()
    if (!tableExists) {
      console.log('[Event Reminders] Events table does not exist, skipping')
      return result
    }

    // Get events needing reminders
    const eventsToRemind = await getEventsNeedingReminders(now)
    result.checked = eventsToRemind.length

    if (eventsToRemind.length === 0) {
      return result
    }

    console.log(`[Event Reminders] Found ${eventsToRemind.length} events needing reminders`)

    const notificationService = getNotificationService()

    for (const event of eventsToRemind) {
      // Get recipients for this event
      const recipients = await getEventReminderRecipients(event.id)

      for (const userId of recipients) {
        // Check if reminder already sent
        if (hasReminderBeenSent(event.id, userId)) {
          result.skipped++
          continue
        }

        // Send reminder
        const sendResult = await notificationService.sendEventReminder(userId, event)

        if (sendResult.success) {
          markReminderAsSent(event.id, userId)
          result.sent++
          console.log(`[Event Reminders] Sent reminder for event ${event.id} to user ${userId}`)
        } else {
          result.failed++
          console.error(`[Event Reminders] Failed to send reminder for event ${event.id} to user ${userId}: ${sendResult.error}`)
        }
      }
    }

    // Cleanup old reminders
    const cleared = clearOldReminders()
    if (cleared > 0) {
      console.log(`[Event Reminders] Cleared ${cleared} old reminder records`)
    }

    return result
  } catch (error) {
    console.error('[Event Reminders] Error processing reminders:', error)
    return result
  }
}

/**
 * Check if events table exists
 */
async function checkEventsTableExists(): Promise<boolean> {
  try {
    await db.select({ id: events.id }).from(events).limit(1)
    return true
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return false
    }
    throw error
  }
}

/**
 * Get user's default reminder minutes from settings
 */
export async function getUserDefaultReminderMinutes(userId: number): Promise<number> {
  try {
    const settings = await db
      .select({ defaultReminderMinutes: notificationSettings.defaultReminderMinutes })
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId))
      .limit(1)

    return settings.length > 0 ? settings[0].defaultReminderMinutes : 60 // Default 1 hour
  } catch (error) {
    console.error('[Event Reminders] Error getting user reminder settings:', error)
    return 60
  }
}

/**
 * Calculate all scheduled reminders for a time window
 * Useful for displaying upcoming reminders to users
 */
export async function getScheduledReminders(
  userId: number,
  fromDate: Date = new Date(),
  toDate: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
): Promise<ScheduledReminder[]> {
  try {
    // Get events where user is organizer
    const organizerEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.organizerId, userId),
          eq(events.status, 'scheduled'),
          gte(events.startDate, fromDate),
          lte(events.startDate, toDate)
        )
      )

    // Get events where user is an accepted participant
    const participantEvents = await db
      .select({
        event: events
      })
      .from(eventParticipants)
      .innerJoin(contacts, eq(eventParticipants.contactId, contacts.id))
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(
        and(
          eq(contacts.linkedUserId, userId),
          eq(eventParticipants.status, 'accepted'),
          eq(events.status, 'scheduled'),
          gte(events.startDate, fromDate),
          lte(events.startDate, toDate)
        )
      )

    // Combine and deduplicate
    const allEvents = new Map<number, Event>()
    for (const event of organizerEvents) {
      allEvents.set(event.id, event)
    }
    for (const { event } of participantEvents) {
      if (!allEvents.has(event.id)) {
        allEvents.set(event.id, event)
      }
    }

    // Calculate reminder times
    const reminders: ScheduledReminder[] = []
    for (const event of allEvents.values()) {
      const reminderTime = calculateReminderTime(event.startDate, event.reminderMinutes)
      if (reminderTime >= fromDate) {
        reminders.push({
          eventId: event.id,
          userId,
          reminderTime,
          event
        })
      }
    }

    // Sort by reminder time
    reminders.sort((a, b) => a.reminderTime.getTime() - b.reminderTime.getTime())

    return reminders
  } catch (error) {
    console.error('[Event Reminders] Error getting scheduled reminders:', error)
    return []
  }
}
