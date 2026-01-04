import cron from 'node-cron'
import { processEventReminders } from '../utils/event-reminders'

/**
 * Nitro plugin for event reminder scheduling
 * Checks for events needing reminders and sends notifications
 * Requirement 11.2: send event reminders at configurable time before event
 */

/**
 * Scheduled task for processing event reminders
 */
export async function scheduledEventReminderTask() {
  console.log('[Event Reminder Scheduler] Running reminder check')
  
  try {
    const result = await processEventReminders()
    
    if (result.sent > 0 || result.failed > 0) {
      console.log(
        `[Event Reminder Scheduler] Completed: checked=${result.checked}, sent=${result.sent}, failed=${result.failed}, skipped=${result.skipped}`
      )
    }
    
    return result
  } catch (error) {
    console.error('[Event Reminder Scheduler] Error:', error)
    throw error
  }
}

/**
 * Initialize the event reminder scheduler
 * Runs every minute to check for events needing reminders
 */
export function initializeEventReminderScheduler() {
  // Run every minute to ensure timely reminders
  const cronExpression = '* * * * *'
  
  console.log('[Event Reminder Scheduler] Initializing')
  console.log(`[Event Reminder Scheduler] Schedule: ${cronExpression} (every minute)`)
  
  const task = cron.schedule(cronExpression, async () => {
    await scheduledEventReminderTask()
  }, {
    scheduled: true,
    timezone: 'UTC'
  })
  
  console.log('[Event Reminder Scheduler] Successfully initialized')
  
  return task
}

/**
 * Run reminder check manually (for testing)
 */
export async function runEventReminderCheckManually() {
  console.log('[Event Reminder Scheduler] Manual run')
  return await processEventReminders()
}

// Nitro plugin export
export default defineNitroPlugin((nitroApp) => {
  console.log('[Nitro Plugin] Initializing event reminder scheduler')
  
  // Initialize only in production or when explicitly enabled
  const shouldInitialize = process.env.ENABLE_SCHEDULER === 'true' || process.env.NODE_ENV === 'production'
  
  if (shouldInitialize) {
    try {
      initializeEventReminderScheduler()
      console.log('[Nitro Plugin] Event reminder scheduler started')
    } catch (error) {
      console.error('[Nitro Plugin] Error initializing event reminder scheduler:', error)
    }
  } else {
    console.log('[Nitro Plugin] Event reminder scheduler disabled (set ENABLE_SCHEDULER=true to enable)')
  }
})
