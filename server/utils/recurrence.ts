/**
 * Recurrence generation utility
 * Generates dates based on recurrence patterns
 * Requirements: 5.1, 5.2, 5.3
 */

import { RECURRENCE_PATTERNS, type RecurrencePattern } from './events'

// Default number of occurrences to generate
export const DEFAULT_OCCURRENCE_COUNT = 10
export const MAX_OCCURRENCE_COUNT = 52 // Max 1 year of weekly events

export interface RecurrenceConfig {
  startDate: Date
  pattern: RecurrencePattern
  interval?: number // For custom pattern - number of days
  count?: number // Number of occurrences to generate (default: 10)
}

export interface GeneratedOccurrence {
  startDate: Date
  endDate: Date
  index: number // 0-based index of the occurrence
}

/**
 * Validates recurrence configuration
 */
export function validateRecurrenceConfig(config: RecurrenceConfig): string | null {
  if (!config.startDate || isNaN(config.startDate.getTime())) {
    return 'Некорректная дата начала'
  }

  if (!config.pattern || !RECURRENCE_PATTERNS.includes(config.pattern)) {
    return `Недопустимый паттерн повторения. Допустимые значения: ${RECURRENCE_PATTERNS.join(', ')}`
  }

  if (config.pattern === 'custom') {
    if (!config.interval || config.interval <= 0 || !Number.isInteger(config.interval)) {
      return 'Укажите интервал повторения (положительное целое число дней)'
    }
  }

  if (config.count !== undefined) {
    if (config.count <= 0 || !Number.isInteger(config.count)) {
      return 'Количество повторений должно быть положительным целым числом'
    }
    if (config.count > MAX_OCCURRENCE_COUNT) {
      return `Максимальное количество повторений: ${MAX_OCCURRENCE_COUNT}`
    }
  }

  return null
}

/**
 * Calculates the next occurrence date based on pattern
 * @param currentDate - Current occurrence date
 * @param pattern - Recurrence pattern
 * @param interval - Custom interval in days (only for 'custom' pattern)
 * @returns Next occurrence date
 */
export function getNextOccurrenceDate(
  currentDate: Date,
  pattern: RecurrencePattern,
  interval?: number
): Date {
  const nextDate = new Date(currentDate)

  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break

    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7)
      break

    case 'monthly':
      // Handle month overflow correctly
      const currentDay = nextDate.getDate()
      nextDate.setMonth(nextDate.getMonth() + 1)
      // If the day changed (e.g., Jan 31 -> Feb 28), it means overflow occurred
      // In this case, we keep the last day of the new month
      if (nextDate.getDate() !== currentDay) {
        // Go back to the last day of the previous month
        nextDate.setDate(0)
      }
      break

    case 'custom':
      if (!interval || interval <= 0) {
        throw new Error('Custom pattern requires a positive interval')
      }
      nextDate.setDate(nextDate.getDate() + interval)
      break

    default:
      throw new Error(`Unknown recurrence pattern: ${pattern}`)
  }

  return nextDate
}

/**
 * Generates occurrence dates based on recurrence configuration
 * @param config - Recurrence configuration
 * @param durationMinutes - Duration of each event in minutes
 * @returns Array of generated occurrences (excluding the first/parent event)
 */
export function generateOccurrences(
  config: RecurrenceConfig,
  durationMinutes: number
): GeneratedOccurrence[] {
  const validationError = validateRecurrenceConfig(config)
  if (validationError) {
    throw new Error(validationError)
  }

  const count = Math.min(config.count ?? DEFAULT_OCCURRENCE_COUNT, MAX_OCCURRENCE_COUNT)
  const occurrences: GeneratedOccurrence[] = []

  let currentDate = new Date(config.startDate)

  // Generate occurrences (starting from index 1, as index 0 is the parent event)
  for (let i = 1; i <= count; i++) {
    currentDate = getNextOccurrenceDate(currentDate, config.pattern, config.interval)
    
    const endDate = new Date(currentDate)
    endDate.setMinutes(endDate.getMinutes() + durationMinutes)

    occurrences.push({
      startDate: new Date(currentDate),
      endDate,
      index: i
    })
  }

  return occurrences
}

/**
 * Calculates the interval in days between occurrences for a given pattern
 * Useful for display purposes
 */
export function getPatternIntervalDays(pattern: RecurrencePattern, customInterval?: number): number {
  switch (pattern) {
    case 'daily':
      return 1
    case 'weekly':
      return 7
    case 'monthly':
      return 30 // Approximate
    case 'custom':
      return customInterval ?? 1
    default:
      return 1
  }
}

/**
 * Formats recurrence pattern for display
 */
export function formatRecurrencePattern(pattern: RecurrencePattern, interval?: number): string {
  switch (pattern) {
    case 'daily':
      return 'Ежедневно'
    case 'weekly':
      return 'Еженедельно'
    case 'monthly':
      return 'Ежемесячно'
    case 'custom':
      if (interval === 1) {
        return 'Каждый день'
      } else if (interval) {
        return `Каждые ${interval} дней`
      }
      return 'Пользовательский интервал'
    default:
      return 'Неизвестный паттерн'
  }
}
