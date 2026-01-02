import type { Contact } from '../db/schema'

/**
 * Получить количество дней для заданной частоты
 * @param frequency - Частота связи (weekly, monthly, quarterly, custom)
 * @param customDays - Пользовательское количество дней (для frequency='custom')
 * @returns Количество дней между напоминаниями
 */
export function getFrequencyInDays(
  frequency: string,
  customDays: number | null
): number {
  switch (frequency) {
    case 'weekly':
      return 7
    case 'monthly':
      return 30
    case 'quarterly':
      return 90
    case 'custom':
      return customDays || 30
    default:
      return 30
  }
}

/**
 * Рассчитать дату следующего напоминания для контакта
 * @param contact - Контакт с настройками частоты
 * @returns Дата следующего напоминания
 */
export function calculateNextReminderDate(contact: Contact): Date {
  // Базовая дата - либо дата последнего контакта, либо дата создания
  const baseDate = contact.lastContactDate || contact.createdAt
  
  // Получаем количество дней для добавления
  const daysToAdd = getFrequencyInDays(
    contact.frequency,
    contact.customFrequencyDays
  )
  
  // Создаем новую дату, добавляя дни
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + daysToAdd)
  
  return nextDate
}

/**
 * Определить, требуется ли напоминание для контакта сегодня
 * @param contact - Контакт для проверки
 * @param today - Текущая дата (по умолчанию - сегодня)
 * @returns true, если контакт требует напоминания
 */
export function isContactDueForReminder(
  contact: Contact,
  today: Date = new Date()
): boolean {
  // Контакт должен быть отслеживаемым
  if (!contact.isTracked) {
    return false
  }
  
  // Если нет даты следующего напоминания, рассчитываем её
  const nextReminderDate = contact.nextReminderDate || calculateNextReminderDate(contact)
  
  // Сравниваем только даты (без времени)
  const todayDate = new Date(today)
  todayDate.setHours(0, 0, 0, 0)
  
  const reminderDate = new Date(nextReminderDate)
  reminderDate.setHours(0, 0, 0, 0)
  
  // Напоминание требуется, если дата напоминания <= сегодня
  return reminderDate <= todayDate
}

/**
 * Получить список контактов, требующих напоминания
 * @param contacts - Массив контактов для проверки
 * @param today - Текущая дата (по умолчанию - сегодня)
 * @returns Массив контактов, требующих напоминания
 */
export function getContactsDueForReminder(
  contacts: Contact[],
  today: Date = new Date()
): Contact[] {
  return contacts.filter(contact => isContactDueForReminder(contact, today))
}
