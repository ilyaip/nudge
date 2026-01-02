import cron from 'node-cron'
import { db } from '../db'
import { users, contacts, reminders } from '../db/schema'
import { eq, and, lte } from 'drizzle-orm'
import { calculateNextReminderDate, isContactDueForReminder } from './reminders'
import type { Contact, NewReminder } from '../db/schema'

/**
 * Интерфейс для запроса на уведомление
 */
export interface NotificationRequest {
  userId: number
  telegramId: string
  contacts: Contact[]
}

/**
 * Рассчитать напоминания для всех пользователей
 * @returns Массив запросов на уведомления
 */
export async function calculateRemindersForAllUsers(): Promise<NotificationRequest[]> {
  try {
    console.log('[Scheduler] Начало расчета напоминаний для всех пользователей')
    
    // Получаем всех пользователей
    const allUsers = await db.select().from(users)
    console.log(`[Scheduler] Найдено пользователей: ${allUsers.length}`)
    
    const notificationRequests: NotificationRequest[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Для каждого пользователя
    for (const user of allUsers) {
      // Получаем все отслеживаемые контакты пользователя
      const userContacts = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, user.id),
            eq(contacts.isTracked, true)
          )
        )
      
      // Фильтруем контакты, требующие напоминания
      const dueContacts = userContacts.filter(contact => 
        isContactDueForReminder(contact, today)
      )
      
      if (dueContacts.length > 0) {
        console.log(
          `[Scheduler] Пользователь ${user.telegramId}: найдено ${dueContacts.length} контактов для напоминания`
        )
        
        // Создаем записи напоминаний в БД
        for (const contact of dueContacts) {
          // Проверяем, нет ли уже напоминания на сегодня
          const existingReminder = await db
            .select()
            .from(reminders)
            .where(
              and(
                eq(reminders.userId, user.id),
                eq(reminders.contactId, contact.id),
                eq(reminders.dueDate, today),
                eq(reminders.completed, false)
              )
            )
            .limit(1)
          
          // Создаем напоминание только если его еще нет
          if (existingReminder.length === 0) {
            const newReminder: NewReminder = {
              userId: user.id,
              contactId: contact.id,
              dueDate: today,
              completed: false,
              notificationSent: false
            }
            
            await db.insert(reminders).values(newReminder)
            console.log(
              `[Scheduler] Создано напоминание для пользователя ${user.telegramId}, контакт: ${contact.name}`
            )
          }
        }
        
        // Добавляем запрос на уведомление
        notificationRequests.push({
          userId: user.id,
          telegramId: user.telegramId,
          contacts: dueContacts
        })
      }
    }
    
    console.log(
      `[Scheduler] Расчет завершен. Сгенерировано запросов на уведомления: ${notificationRequests.length}`
    )
    
    return notificationRequests
  } catch (error) {
    console.error('[Scheduler] Ошибка при расчете напоминаний:', error)
    throw error
  }
}

/**
 * Задача планировщика для ежедневного расчета напоминаний
 */
export async function scheduledReminderTask() {
  console.log('[Scheduler] Запуск задачи расчета напоминаний')
  
  try {
    // Рассчитываем напоминания для всех пользователей
    const notificationRequests = await calculateRemindersForAllUsers()
    
    if (notificationRequests.length === 0) {
      console.log('[Scheduler] Нет напоминаний для отправки')
      return { notificationRequests: [], results: [] }
    }
    
    // Отправляем уведомления через Telegram Bot
    const { sendNotifications } = await import('./telegram-bot')
    const results = await sendNotifications(notificationRequests)
    
    console.log(
      `[Scheduler] Задача завершена. Отправлено уведомлений: ${results.filter(r => r.success).length}/${results.length}`
    )
    
    return { notificationRequests, results }
  } catch (error) {
    console.error('[Scheduler] Ошибка выполнения задачи:', error)
    throw error
  }
}

/**
 * Инициализировать планировщик cron
 * Запускается каждый день в 9:00 утра
 */
export function initializeScheduler() {
  // Запуск каждый день в 9:00 (по серверному времени)
  // Формат cron: секунда минута час день месяц день_недели
  const cronExpression = '0 9 * * *' // 9:00 каждый день
  
  console.log('[Scheduler] Инициализация планировщика напоминаний')
  console.log(`[Scheduler] Расписание: ${cronExpression} (9:00 каждый день)`)
  
  const task = cron.schedule(cronExpression, async () => {
    await scheduledReminderTask()
  }, {
    scheduled: true,
    timezone: 'UTC' // Используем UTC для консистентности
  })
  
  console.log('[Scheduler] Планировщик успешно инициализирован')
  
  return task
}

/**
 * Запустить задачу планировщика вручную (для тестирования)
 */
export async function runSchedulerManually() {
  console.log('[Scheduler] Ручной запуск задачи планировщика')
  return await scheduledReminderTask()
}
