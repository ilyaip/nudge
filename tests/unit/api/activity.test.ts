import { describe, it, expect, beforeEach, vi } from 'vitest'
import { aggregateActivity, getCompletedRemindersCount, getTotalXPForPeriod } from '../../../server/utils/activity'

// Мокаем базу данных
vi.mock('../../../server/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    }))
  },
  schema: {
    activityLogs: {},
    users: {}
  }
}))

describe('Activity Utils', () => {
  describe('aggregateActivity', () => {
    it('должен возвращать данные активности за неделю', async () => {
      const result = await aggregateActivity(1, 'week')
      
      expect(result).toBeDefined()
      expect(result.period).toBe('week')
      expect(result.activities).toBeInstanceOf(Array)
      expect(result.activities.length).toBe(7) // 7 дней в неделе
      expect(result.totalCompleted).toBe(0)
      expect(result.totalXP).toBe(0)
    })

    it('должен возвращать данные активности за месяц', async () => {
      const result = await aggregateActivity(1, 'month')
      
      expect(result).toBeDefined()
      expect(result.period).toBe('month')
      expect(result.activities).toBeInstanceOf(Array)
      expect(result.activities.length).toBe(30) // 30 дней в месяце
      expect(result.totalCompleted).toBe(0)
      expect(result.totalXP).toBe(0)
    })

    it('должен инициализировать все дни нулями', async () => {
      const result = await aggregateActivity(1, 'week')
      
      result.activities.forEach(activity => {
        expect(activity).toHaveProperty('date')
        expect(activity).toHaveProperty('completedReminders')
        expect(activity).toHaveProperty('xpEarned')
        expect(activity.completedReminders).toBe(0)
        expect(activity.xpEarned).toBe(0)
      })
    })

    it('должен возвращать корректные даты начала и конца', async () => {
      const result = await aggregateActivity(1, 'week')
      
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      
      const startDate = new Date(result.startDate)
      const endDate = new Date(result.endDate)
      
      expect(startDate).toBeInstanceOf(Date)
      expect(endDate).toBeInstanceOf(Date)
      expect(startDate.getTime()).toBeLessThanOrEqual(endDate.getTime())
    })
  })

  describe('getCompletedRemindersCount', () => {
    it('должен возвращать 0 для пользователя без активности', async () => {
      const count = await getCompletedRemindersCount(1, 'week')
      expect(count).toBe(0)
    })
  })

  describe('getTotalXPForPeriod', () => {
    it('должен возвращать 0 для пользователя без активности', async () => {
      const xp = await getTotalXPForPeriod(1, 'week')
      expect(xp).toBe(0)
    })
  })
})
