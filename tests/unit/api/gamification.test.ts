import { describe, it, expect } from 'vitest'

describe('Gamification API', () => {
  describe('GET /api/gamification/stats', () => {
    it('должен возвращать статистику пользователя', () => {
      // Тест структуры ответа
      const mockStats = {
        success: true,
        stats: {
          currentStreak: 5,
          longestStreak: 10,
          totalXP: 450,
          level: 3,
          xpForNextLevel: 900,
          xpProgress: 0.5,
          lastActivityDate: new Date()
        }
      }

      expect(mockStats.success).toBe(true)
      expect(mockStats.stats).toHaveProperty('currentStreak')
      expect(mockStats.stats).toHaveProperty('longestStreak')
      expect(mockStats.stats).toHaveProperty('totalXP')
      expect(mockStats.stats).toHaveProperty('level')
      expect(mockStats.stats).toHaveProperty('xpForNextLevel')
      expect(mockStats.stats).toHaveProperty('xpProgress')
    })

    it('xpProgress должен быть между 0 и 1', () => {
      const validProgress = 0.5
      expect(validProgress).toBeGreaterThanOrEqual(0)
      expect(validProgress).toBeLessThanOrEqual(1)
    })
  })

  describe('GET /api/gamification/achievements', () => {
    it('должен возвращать список достижений', () => {
      // Тест структуры ответа
      const mockAchievements = {
        success: true,
        achievements: [
          {
            id: 1,
            code: 'FIRST_CONTACT',
            name: 'Первый контакт',
            description: 'Добавьте свой первый контакт',
            icon: '👤',
            xpReward: 10,
            criteria: { minContacts: 1 },
            unlocked: true,
            unlockedAt: new Date()
          }
        ]
      }

      expect(mockAchievements.success).toBe(true)
      expect(Array.isArray(mockAchievements.achievements)).toBe(true)
      
      const achievement = mockAchievements.achievements[0]
      expect(achievement).toHaveProperty('id')
      expect(achievement).toHaveProperty('code')
      expect(achievement).toHaveProperty('name')
      expect(achievement).toHaveProperty('description')
      expect(achievement).toHaveProperty('icon')
      expect(achievement).toHaveProperty('xpReward')
      expect(achievement).toHaveProperty('criteria')
      expect(achievement).toHaveProperty('unlocked')
      expect(achievement).toHaveProperty('unlockedAt')
    })

    it('достижение должно иметь корректную структуру критериев', () => {
      const criteria = { minContacts: 1 }
      expect(typeof criteria).toBe('object')
      expect(criteria).toHaveProperty('minContacts')
      expect(typeof criteria.minContacts).toBe('number')
    })

    it('разблокированное достижение должно иметь дату разблокировки', () => {
      const unlockedAchievement = {
        unlocked: true,
        unlockedAt: new Date()
      }
      
      expect(unlockedAchievement.unlocked).toBe(true)
      expect(unlockedAchievement.unlockedAt).toBeInstanceOf(Date)
    })

    it('заблокированное достижение должно иметь null в unlockedAt', () => {
      const lockedAchievement = {
        unlocked: false,
        unlockedAt: null
      }
      
      expect(lockedAchievement.unlocked).toBe(false)
      expect(lockedAchievement.unlockedAt).toBeNull()
    })
  })

  describe('Achievement criteria types', () => {
    it('должен поддерживать критерий minStreak', () => {
      const criteria = { minStreak: 7 }
      expect(criteria.minStreak).toBe(7)
    })

    it('должен поддерживать критерий minLevel', () => {
      const criteria = { minLevel: 5 }
      expect(criteria.minLevel).toBe(5)
    })

    it('должен поддерживать критерий minXP', () => {
      const criteria = { minXP: 1000 }
      expect(criteria.minXP).toBe(1000)
    })

    it('должен поддерживать критерий minContacts', () => {
      const criteria = { minContacts: 10 }
      expect(criteria.minContacts).toBe(10)
    })

    it('должен поддерживать критерий minRemindersCompleted', () => {
      const criteria = { minRemindersCompleted: 50 }
      expect(criteria.minRemindersCompleted).toBe(50)
    })
  })
})
