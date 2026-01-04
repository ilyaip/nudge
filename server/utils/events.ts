/**
 * Event validation and utility functions
 * Validates event data according to requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

// Valid event types
export const EVENT_TYPES = ['meeting', 'call', 'trip', 'other'] as const
export type EventType = typeof EVENT_TYPES[number]

// Valid event statuses
export const EVENT_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const
export type EventStatus = typeof EVENT_STATUSES[number]

// Valid recurrence patterns
export const RECURRENCE_PATTERNS = ['daily', 'weekly', 'monthly', 'custom'] as const
export type RecurrencePattern = typeof RECURRENCE_PATTERNS[number]

// Duration constraints (in minutes)
export const MIN_DURATION_MINUTES = 15
export const MAX_DURATION_MINUTES = 1440 // 24 hours

// Validation error interface
export interface ValidationError {
  field: string
  message: string
}

// Event creation request interface
export interface CreateEventRequest {
  title: string
  type: EventType
  customType?: string
  description?: string
  startDate: string // ISO date string
  duration: number // minutes
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  recurrenceInterval?: number
  recurrenceCount?: number // Number of occurrences to generate for recurring events
  reminderMinutes?: number
  participantContactIds?: number[]
}

// Event update request interface
export interface UpdateEventRequest {
  title?: string
  type?: EventType
  customType?: string
  description?: string
  startDate?: string
  duration?: number
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  recurrenceInterval?: number
  reminderMinutes?: number
  participantContactIds?: number[]
}

/**
 * Validates event title
 * Requirement 4.1: title is required
 */
export function validateTitle(title: string | undefined | null): ValidationError | null {
  if (!title || title.trim().length === 0) {
    return {
      field: 'title',
      message: 'Поле title обязательно'
    }
  }
  if (title.trim().length > 255) {
    return {
      field: 'title',
      message: 'Название события не должно превышать 255 символов'
    }
  }
  return null
}

/**
 * Validates event type
 * Requirement 4.2: predefined types - meeting, call, trip, other
 */
export function validateType(type: string | undefined | null): ValidationError | null {
  if (!type) {
    return {
      field: 'type',
      message: 'Поле type обязательно'
    }
  }
  if (!EVENT_TYPES.includes(type as EventType)) {
    return {
      field: 'type',
      message: `Недопустимый тип события. Допустимые значения: ${EVENT_TYPES.join(', ')}`
    }
  }
  return null
}

/**
 * Validates custom type when type is 'other'
 * Requirement 4.3: custom type required when type is 'other'
 */
export function validateCustomType(type: string, customType: string | undefined | null): ValidationError | null {
  if (type === 'other') {
    if (!customType || customType.trim().length === 0) {
      return {
        field: 'customType',
        message: 'Укажите название типа события для "другое"'
      }
    }
    if (customType.trim().length > 100) {
      return {
        field: 'customType',
        message: 'Название типа события не должно превышать 100 символов'
      }
    }
  }
  return null
}

/**
 * Validates event start date
 * Requirement 4.4: date/time must be in the future
 */
export function validateStartDate(startDate: string | undefined | null, now: Date = new Date()): ValidationError | null {
  if (!startDate) {
    return {
      field: 'startDate',
      message: 'Поле startDate обязательно'
    }
  }

  const parsedDate = new Date(startDate)
  if (isNaN(parsedDate.getTime())) {
    return {
      field: 'startDate',
      message: 'Некорректный формат даты'
    }
  }

  if (parsedDate <= now) {
    return {
      field: 'startDate',
      message: 'Дата события должна быть в будущем'
    }
  }

  return null
}

/**
 * Validates event duration
 * Requirement 4.5: duration from 15 minutes to 24 hours
 */
export function validateDuration(duration: number | undefined | null): ValidationError | null {
  if (duration === undefined || duration === null) {
    return {
      field: 'duration',
      message: 'Поле duration обязательно'
    }
  }

  if (typeof duration !== 'number' || !Number.isInteger(duration)) {
    return {
      field: 'duration',
      message: 'Продолжительность должна быть целым числом'
    }
  }

  if (duration < MIN_DURATION_MINUTES || duration > MAX_DURATION_MINUTES) {
    return {
      field: 'duration',
      message: `Продолжительность должна быть от ${MIN_DURATION_MINUTES} минут до ${MAX_DURATION_MINUTES / 60} часов`
    }
  }

  return null
}

/**
 * Validates recurrence settings
 * Requirements 5.1, 5.2: recurrence pattern and custom interval
 */
export function validateRecurrence(
  isRecurring: boolean | undefined,
  recurrencePattern: string | undefined | null,
  recurrenceInterval: number | undefined | null
): ValidationError | null {
  if (!isRecurring) {
    return null
  }

  if (!recurrencePattern) {
    return {
      field: 'recurrencePattern',
      message: 'Укажите паттерн повторения для повторяющегося события'
    }
  }

  if (!RECURRENCE_PATTERNS.includes(recurrencePattern as RecurrencePattern)) {
    return {
      field: 'recurrencePattern',
      message: `Недопустимый паттерн повторения. Допустимые значения: ${RECURRENCE_PATTERNS.join(', ')}`
    }
  }

  if (recurrencePattern === 'custom') {
    if (!recurrenceInterval || recurrenceInterval <= 0) {
      return {
        field: 'recurrenceInterval',
        message: 'Укажите интервал повторения (положительное число дней)'
      }
    }
  }

  return null
}

/**
 * Validates reminder minutes
 */
export function validateReminderMinutes(reminderMinutes: number | undefined | null): ValidationError | null {
  if (reminderMinutes === undefined || reminderMinutes === null) {
    return null // Optional field, defaults to 60
  }

  if (typeof reminderMinutes !== 'number' || reminderMinutes < 0) {
    return {
      field: 'reminderMinutes',
      message: 'Время напоминания должно быть неотрицательным числом'
    }
  }

  return null
}

/**
 * Validates complete event creation request
 * Returns array of validation errors (empty if valid)
 */
export function validateCreateEventRequest(request: CreateEventRequest, now: Date = new Date()): ValidationError[] {
  const errors: ValidationError[] = []

  const titleError = validateTitle(request.title)
  if (titleError) errors.push(titleError)

  const typeError = validateType(request.type)
  if (typeError) errors.push(typeError)

  if (!typeError) {
    const customTypeError = validateCustomType(request.type, request.customType)
    if (customTypeError) errors.push(customTypeError)
  }

  const startDateError = validateStartDate(request.startDate, now)
  if (startDateError) errors.push(startDateError)

  const durationError = validateDuration(request.duration)
  if (durationError) errors.push(durationError)

  const recurrenceError = validateRecurrence(
    request.isRecurring,
    request.recurrencePattern,
    request.recurrenceInterval
  )
  if (recurrenceError) errors.push(recurrenceError)

  const reminderError = validateReminderMinutes(request.reminderMinutes)
  if (reminderError) errors.push(reminderError)

  return errors
}

/**
 * Validates event update request (partial validation)
 * Only validates fields that are present in the request
 */
export function validateUpdateEventRequest(request: UpdateEventRequest, now: Date = new Date()): ValidationError[] {
  const errors: ValidationError[] = []

  if (request.title !== undefined) {
    const titleError = validateTitle(request.title)
    if (titleError) errors.push(titleError)
  }

  if (request.type !== undefined) {
    const typeError = validateType(request.type)
    if (typeError) errors.push(typeError)

    if (!typeError) {
      const customTypeError = validateCustomType(request.type, request.customType)
      if (customTypeError) errors.push(customTypeError)
    }
  }

  if (request.startDate !== undefined) {
    const startDateError = validateStartDate(request.startDate, now)
    if (startDateError) errors.push(startDateError)
  }

  if (request.duration !== undefined) {
    const durationError = validateDuration(request.duration)
    if (durationError) errors.push(durationError)
  }

  if (request.isRecurring !== undefined) {
    const recurrenceError = validateRecurrence(
      request.isRecurring,
      request.recurrencePattern,
      request.recurrenceInterval
    )
    if (recurrenceError) errors.push(recurrenceError)
  }

  if (request.reminderMinutes !== undefined) {
    const reminderError = validateReminderMinutes(request.reminderMinutes)
    if (reminderError) errors.push(reminderError)
  }

  return errors
}

/**
 * Calculates end date from start date and duration
 */
export function calculateEndDate(startDate: Date, durationMinutes: number): Date {
  const endDate = new Date(startDate)
  endDate.setMinutes(endDate.getMinutes() + durationMinutes)
  return endDate
}

/**
 * Formats validation errors into a single message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(e => e.message).join('; ')
}
