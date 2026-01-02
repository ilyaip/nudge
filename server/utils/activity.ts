import { db, schema } from '../db'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

/**
 * Тип периода для агрегации активности
 */
export type ActivityPeriod = 'week' | 'month'

/**
 * Интерфейс данных активности за день
 */
export interface DailyActivity {
  date: string // YYYY-MM-DD
  completedReminders: number
  xpEarned: number
}

/**
 * Интерфейс агрегированных данных активности
 */
export interface ActivityData {
  period: ActivityPeriod
  startDate: string
  endDate: string
  activities: DailyActivity[]
  totalCompleted: number
  totalXP: number
}

/**
 * Получить начальную и конечную даты для периода
 * 
 * @param period - Период агрегации ('week' или 'month')
 * @returns Объект с начальной и конечной датами
 */
function getPeriodDates(period: ActivityPeriod): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)
  
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  
  if (period === 'week') {
    // Последние 7 дней
    startDate.setDate(startDate.getDate() - 6)
  } else {
    // Последние 30 дней
    startDate.setDate(startDate.getDate() - 29)
  }
  
  return { startDate, endDate }
}

/**
 * Форматировать дату в строку YYYY-MM-DD
 * 
 * @param date - Дата для форматирования
 * @returns Строка в формате YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Агрегировать логи активности по дням для указанного периода
 * 
 * @param userId - ID пользователя
 * @param period - Период агрегации ('week' или 'month')
 * @returns Агрегированные данные активности
 */
export async function aggregateActivity(
  userId: number,
  period: ActivityPeriod = 'week'
): Promise<ActivityData> {
  const { startDate, endDate } = getPeriodDates(period)
  
  // Получить все логи активности за период
  const activityLogs = await db
    .select()
    .from(schema.activityLogs)
    .where(
      and(
        eq(schema.activityLogs.userId, userId),
        gte(schema.activityLogs.createdAt, startDate),
        lte(schema.activityLogs.createdAt, endDate)
      )
    )
    .orderBy(schema.activityLogs.createdAt)
  
  // Создать map для группировки по дням
  const dailyMap = new Map<string, DailyActivity>()
  
  // Инициализировать все дни в периоде нулями
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate)
    dailyMap.set(dateStr, {
      date: dateStr,
      completedReminders: 0,
      xpEarned: 0
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Агрегировать данные по дням
  let totalCompleted = 0
  let totalXP = 0
  
  for (const log of activityLogs) {
    const dateStr = formatDate(new Date(log.createdAt))
    const daily = dailyMap.get(dateStr)
    
    if (daily) {
      // Подсчитать завершенные напоминания
      if (log.action === 'REMINDER_COMPLETED') {
        daily.completedReminders++
        totalCompleted++
      }
      
      // Суммировать XP
      daily.xpEarned += log.xpAwarded
      totalXP += log.xpAwarded
    }
  }
  
  // Преобразовать map в массив
  const activities = Array.from(dailyMap.values())
  
  return {
    period,
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    activities,
    totalCompleted,
    totalXP
  }
}

/**
 * Получить количество завершенных напоминаний за период
 * 
 * @param userId - ID пользователя
 * @param period - Период агрегации ('week' или 'month')
 * @returns Количество завершенных напоминаний
 */
export async function getCompletedRemindersCount(
  userId: number,
  period: ActivityPeriod = 'week'
): Promise<number> {
  const { startDate, endDate } = getPeriodDates(period)
  
  const result = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(schema.activityLogs)
    .where(
      and(
        eq(schema.activityLogs.userId, userId),
        eq(schema.activityLogs.action, 'REMINDER_COMPLETED'),
        gte(schema.activityLogs.createdAt, startDate),
        lte(schema.activityLogs.createdAt, endDate)
      )
    )
  
  return result[0]?.count || 0
}

/**
 * Получить общий XP, заработанный за период
 * 
 * @param userId - ID пользователя
 * @param period - Период агрегации ('week' или 'month')
 * @returns Общий XP за период
 */
export async function getTotalXPForPeriod(
  userId: number,
  period: ActivityPeriod = 'week'
): Promise<number> {
  const { startDate, endDate } = getPeriodDates(period)
  
  const result = await db
    .select({
      total: sql<number>`sum(${schema.activityLogs.xpAwarded})`
    })
    .from(schema.activityLogs)
    .where(
      and(
        eq(schema.activityLogs.userId, userId),
        gte(schema.activityLogs.createdAt, startDate),
        lte(schema.activityLogs.createdAt, endDate)
      )
    )
  
  return result[0]?.total || 0
}
