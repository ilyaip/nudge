import cron from 'node-cron'
import { db } from '../db'
import { events } from '../db/schema'
import { eq, and, lte, or } from 'drizzle-orm'

/**
 * Плагин Nitro для автоматического обновления статусов событий
 * Переходы: scheduled → in_progress → completed
 * Требования: 8.2, 8.3
 */

/**
 * Обновляет статусы событий на основе текущего времени
 * - scheduled → in_progress: когда now >= startDate (и endDate еще не наступил)
 * - scheduled → completed: когда now >= endDate (событие полностью прошло)
 * - in_progress → completed: когда now >= endDate
 */
export async function updateEventStatuses(): Promise<{
  toInProgress: number
  toCompleted: number
}> {
  const now = new Date()
  let toInProgress = 0
  let toCompleted = 0

  try {
    // Проверяем существование таблицы events
    const tableExists = await checkEventsTableExists()
    if (!tableExists) {
      console.log('[Event Status Updater] Таблица events не существует, пропускаем обновление')
      return { toInProgress: 0, toCompleted: 0 }
    }

    // 1. Переход scheduled → completed (для событий, которые полностью прошли)
    // Это нужно сделать первым, чтобы не переводить в in_progress события, которые уже завершились
    const scheduledToCompleted = await db
      .update(events)
      .set({ 
        status: 'completed',
        updatedAt: now
      })
      .where(
        and(
          eq(events.status, 'scheduled'),
          lte(events.endDate, now)
        )
      )
      .returning({ id: events.id })

    // 2. Переход scheduled → in_progress
    // События, которые должны начаться (startDate <= now) и имеют статус scheduled
    // (после первого шага здесь останутся только события, которые еще не завершились)
    const scheduledToInProgress = await db
      .update(events)
      .set({ 
        status: 'in_progress',
        updatedAt: now
      })
      .where(
        and(
          eq(events.status, 'scheduled'),
          lte(events.startDate, now)
        )
      )
      .returning({ id: events.id })

    toInProgress = scheduledToInProgress.length

    // 3. Переход in_progress → completed
    // События, которые должны завершиться (endDate <= now) и имеют статус in_progress
    const inProgressToCompleted = await db
      .update(events)
      .set({ 
        status: 'completed',
        updatedAt: now
      })
      .where(
        and(
          eq(events.status, 'in_progress'),
          lte(events.endDate, now)
        )
      )
      .returning({ id: events.id })

    toCompleted = scheduledToCompleted.length + inProgressToCompleted.length

    if (toInProgress > 0 || toCompleted > 0) {
      console.log(
        `[Event Status Updater] Обновлено статусов: ${toInProgress} → in_progress, ${toCompleted} → completed`
      )
    }

    return { toInProgress, toCompleted }
  } catch (error) {
    console.error('[Event Status Updater] Ошибка обновления статусов:', error)
    throw error
  }
}

/**
 * Проверяет существование таблицы events в базе данных
 */
async function checkEventsTableExists(): Promise<boolean> {
  try {
    // Пробуем выполнить простой запрос к таблице
    await db.select({ id: events.id }).from(events).limit(1)
    return true
  } catch (error: any) {
    // Если таблица не существует, вернется ошибка
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      return false
    }
    // Другие ошибки пробрасываем
    throw error
  }
}

/**
 * Задача планировщика для обновления статусов событий
 */
export async function scheduledEventStatusTask() {
  console.log('[Event Status Updater] Запуск задачи обновления статусов')
  
  try {
    const result = await updateEventStatuses()
    console.log('[Event Status Updater] Задача завершена')
    return result
  } catch (error) {
    console.error('[Event Status Updater] Ошибка выполнения задачи:', error)
    throw error
  }
}

/**
 * Инициализировать планировщик обновления статусов событий
 * Запускается каждую минуту для своевременного обновления статусов
 */
export function initializeEventStatusUpdater() {
  // Запуск каждую минуту
  const cronExpression = '* * * * *'
  
  console.log('[Event Status Updater] Инициализация планировщика')
  console.log(`[Event Status Updater] Расписание: ${cronExpression} (каждую минуту)`)
  
  const task = cron.schedule(cronExpression, async () => {
    await scheduledEventStatusTask()
  }, {
    scheduled: true,
    timezone: 'UTC'
  })
  
  console.log('[Event Status Updater] Планировщик успешно инициализирован')
  
  return task
}

/**
 * Запустить обновление статусов вручную (для тестирования)
 */
export async function runEventStatusUpdateManually() {
  console.log('[Event Status Updater] Ручной запуск обновления статусов')
  return await updateEventStatuses()
}

// Nitro plugin export
export default defineNitroPlugin((nitroApp) => {
  console.log('[Nitro Plugin] Инициализация планировщика обновления статусов событий')
  
  // Инициализируем планировщик только в production или при явном указании
  const shouldInitialize = process.env.ENABLE_SCHEDULER === 'true' || process.env.NODE_ENV === 'production'
  
  if (shouldInitialize) {
    try {
      initializeEventStatusUpdater()
      console.log('[Nitro Plugin] Планировщик статусов событий успешно запущен')
    } catch (error) {
      console.error('[Nitro Plugin] Ошибка инициализации планировщика статусов:', error)
    }
  } else {
    console.log('[Nitro Plugin] Планировщик статусов отключен (установите ENABLE_SCHEDULER=true для включения)')
  }
})
