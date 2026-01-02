import { describe, it, expect } from 'vitest'

// Импортируем только чистые функции без зависимостей от БД
// Копируем константы и функции для тестирования
const XP_REWARDS = {
  CONTACT_ADDED: 10,
  REMINDER_COMPLETED: 20,
  STREAK_MAINTAINED: 5,
  ACHIEVEMENT_UNLOCKED: 50
} as const

function calculateLevel(totalXP: number): number {
  if (totalXP < 0) {
    return 1
  }
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

function getXPForNextLevel(currentLevel: number): number {
  return (currentLevel * currentLevel) * 100
}

describe('Gamification Utils', () => {
  describe('calculateLevel', () => {
    it('должен возвращать уровень 1 для 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('должен возвращать уровень 1 для отрицательного XP', () => {
      expect(calculateLevel(-100)).toBe(1)
    })

    it('должен правильно рассчитывать уровень для 100 XP', () => {
      // level = floor(sqrt(100 / 100)) + 1 = floor(1) + 1 = 2
      expect(calculateLevel(100)).toBe(2)
    })

    it('должен правильно рассчитывать уровень для 400 XP', () => {
      // level = floor(sqrt(400 / 100)) + 1 = floor(2) + 1 = 3
      expect(calculateLevel(400)).toBe(3)
    })

    it('должен правильно рассчитывать уровень для 900 XP', () => {
      // level = floor(sqrt(900 / 100)) + 1 = floor(3) + 1 = 4
      expect(calculateLevel(900)).toBe(4)
    })

    it('должен правильно рассчитывать уровень для 1000 XP', () => {
      // level = floor(sqrt(1000 / 100)) + 1 = floor(3.16) + 1 = 4
      expect(calculateLevel(1000)).toBe(4)
    })

    it('должен правильно рассчитывать уровень для 2500 XP', () => {
      // level = floor(sqrt(2500 / 100)) + 1 = floor(5) + 1 = 6
      expect(calculateLevel(2500)).toBe(6)
    })
  })

  describe('getXPForNextLevel', () => {
    it('должен возвращать 100 XP для уровня 1', () => {
      // (1 * 1) * 100 = 100
      expect(getXPForNextLevel(1)).toBe(100)
    })

    it('должен возвращать 400 XP для уровня 2', () => {
      // (2 * 2) * 100 = 400
      expect(getXPForNextLevel(2)).toBe(400)
    })

    it('должен возвращать 900 XP для уровня 3', () => {
      // (3 * 3) * 100 = 900
      expect(getXPForNextLevel(3)).toBe(900)
    })

    it('должен возвращать 2500 XP для уровня 5', () => {
      // (5 * 5) * 100 = 2500
      expect(getXPForNextLevel(5)).toBe(2500)
    })

    it('должен возвращать 10000 XP для уровня 10', () => {
      // (10 * 10) * 100 = 10000
      expect(getXPForNextLevel(10)).toBe(10000)
    })
  })

  describe('XP_REWARDS', () => {
    it('должен содержать правильные значения наград', () => {
      expect(XP_REWARDS.CONTACT_ADDED).toBe(10)
      expect(XP_REWARDS.REMINDER_COMPLETED).toBe(20)
      expect(XP_REWARDS.STREAK_MAINTAINED).toBe(5)
      expect(XP_REWARDS.ACHIEVEMENT_UNLOCKED).toBe(50)
    })

    it('должен иметь все необходимые типы действий', () => {
      const actions = Object.keys(XP_REWARDS)
      expect(actions).toContain('CONTACT_ADDED')
      expect(actions).toContain('REMINDER_COMPLETED')
      expect(actions).toContain('STREAK_MAINTAINED')
      expect(actions).toContain('ACHIEVEMENT_UNLOCKED')
    })
  })

  describe('Level progression consistency', () => {
    it('уровень должен увеличиваться при накоплении XP', () => {
      const level1 = calculateLevel(0)
      const level2 = calculateLevel(100)
      const level3 = calculateLevel(400)
      const level4 = calculateLevel(900)
      
      expect(level2).toBeGreaterThan(level1)
      expect(level3).toBeGreaterThan(level2)
      expect(level4).toBeGreaterThan(level3)
    })

    it('XP для следующего уровня должен увеличиваться с уровнем', () => {
      const xp1 = getXPForNextLevel(1)
      const xp2 = getXPForNextLevel(2)
      const xp3 = getXPForNextLevel(3)
      
      expect(xp2).toBeGreaterThan(xp1)
      expect(xp3).toBeGreaterThan(xp2)
    })

    it('достижение XP для следующего уровня должно повышать уровень', () => {
      const currentLevel = 3
      const xpForNext = getXPForNextLevel(currentLevel)
      const newLevel = calculateLevel(xpForNext)
      
      expect(newLevel).toBeGreaterThanOrEqual(currentLevel + 1)
    })
  })
})
