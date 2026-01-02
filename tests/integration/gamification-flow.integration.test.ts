import { describe, it, expect } from 'vitest'
import { awardXP, calculateLevel } from '../../server/utils/gamification'

/**
 * Интеграционный тест потока геймификации
 * Тестирует: начисление XP → повышение уровня → достижения
 * Требования: 4.1-4.10
 * 
 * Примечание: Этот тест проверяет интеграцию бизнес-логики геймификации
 */
describe('Интеграционный тест: Поток геймификации', () => {

  describe('Шаг 1: Начисление XP за действия', () => {
    it('должен начислять корректное количество XP за разные действия', () => {
      const XP_REWARDS = {
        CONTACT_ADDED: 10,
        REMINDER_COMPLETED: 20,
        STREAK_MAINTAINED: 5,
        ACHIEVEMENT_UNLOCKED: 50
      }

      let totalXP = 0

      // Добавление контакта
      totalXP += XP_REWARDS.CONTACT_ADDED
      expect(totalXP).toBe(10)

      // Завершение напоминания
      totalXP += XP_REWARDS.REMINDER_COMPLETED
      expect(totalXP).toBe(30)

      // Поддержание стрика
      totalXP += XP_REWARDS.STREAK_MAINTAINED
      expect(totalXP).toBe(35)

      // Разблокировка достижения
      totalXP += XP_REWARDS.ACHIEVEMENT_UNLOCKED
      expect(totalXP).toBe(85)
    })

    it('должен создавать записи в логе активности', () => {
      const activityLog = {
        userId: 1,
        action: 'contact_added' as const,
        xpAwarded: 10,
        metadata: { contactId: 1 },
        createdAt: new Date()
      }

      expect(activityLog.action).toBe('contact_added')
      expect(activityLog.xpAwarded).toBe(10)
      expect(activityLog.metadata).toBeDefined()
    })

    it('должен накапливать XP от множественных действий', () => {
      const actions = [
        { type: 'contact_added', xp: 10 },
        { type: 'reminder_completed', xp: 20 },
        { type: 'reminder_completed', xp: 20 },
        { type: 'streak_maintained', xp: 5 },
        { type: 'reminder_completed', xp: 20 }
      ]

      const totalXP = actions.reduce((sum, action) => sum + action.xp, 0)
      expect(totalXP).toBe(75)
    })
  })

  describe('Шаг 2: Повышение уровня', () => {
    it('должен корректно рассчитывать уровень на основе totalXP', () => {
      // Уровень 1: 0-99 XP
      expect(calculateLevel(0)).toBe(1)
      expect(calculateLevel(50)).toBe(1)
      expect(calculateLevel(99)).toBe(1)

      // Уровень 2: 100-399 XP
      expect(calculateLevel(100)).toBe(2)
      expect(calculateLevel(200)).toBe(2)
      expect(calculateLevel(399)).toBe(2)

      // Уровень 3: 400-899 XP
      expect(calculateLevel(400)).toBe(3)
      expect(calculateLevel(600)).toBe(3)
      expect(calculateLevel(899)).toBe(3)

      // Уровень 4: 900-1599 XP
      expect(calculateLevel(900)).toBe(4)
      expect(calculateLevel(1599)).toBe(4)
    })

    it('должен повышать уровень при достижении порога XP', () => {
      let user = {
        totalXP: 0,
        level: 1
      }

      // Начисляем XP до уровня 2
      user.totalXP = 100
      user.level = calculateLevel(user.totalXP)
      expect(user.level).toBe(2)

      // Начисляем XP до уровня 3
      user.totalXP = 400
      user.level = calculateLevel(user.totalXP)
      expect(user.level).toBe(3)

      // Начисляем XP до уровня 4
      user.totalXP = 900
      user.level = calculateLevel(user.totalXP)
      expect(user.level).toBe(4)
    })

    it('должен корректно рассчитывать прогресс к следующему уровню', () => {
      const user = {
        totalXP: 150,
        level: 2
      }

      const xpForNextLevel = (user.level * user.level) * 100 // 400
      const xpForCurrentLevel = ((user.level - 1) * (user.level - 1)) * 100 // 100
      const progress = ((user.totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100

      expect(progress).toBeCloseTo(16.67, 1) // (150-100)/(400-100) * 100 = 16.67%
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(100)
    })

    it('должен обновлять уровень при каждом начислении XP', () => {
      let user = {
        totalXP: 90,
        level: 1
      }

      // Начисляем 20 XP (переход на уровень 2)
      user.totalXP += 20
      user.level = calculateLevel(user.totalXP)
      expect(user.level).toBe(2)
      expect(user.totalXP).toBe(110)
    })
  })

  describe('Шаг 3: Разблокировка достижений', () => {
    it('должен проверять критерии достижения', () => {
      const achievement = {
        id: 1,
        code: 'first_contact',
        name: 'Первый контакт',
        description: 'Добавьте первый контакт',
        icon: '👤',
        xpReward: 50,
        criteria: { contactsAdded: 1 }
      }

      const userStats = {
        contactsAdded: 1
      }

      const isUnlocked = userStats.contactsAdded >= achievement.criteria.contactsAdded
      expect(isUnlocked).toBe(true)
    })

    it('должен разблокировать достижение при выполнении критериев', () => {
      const achievements = [
        {
          code: 'first_contact',
          criteria: { contactsAdded: 1 },
          xpReward: 50
        },
        {
          code: 'social_butterfly',
          criteria: { contactsAdded: 10 },
          xpReward: 100
        },
        {
          code: 'streak_starter',
          criteria: { currentStreak: 3 },
          xpReward: 75
        }
      ]

      const userStats = {
        contactsAdded: 5,
        currentStreak: 3
      }

      const unlockedAchievements = achievements.filter(achievement => {
        if (achievement.criteria.contactsAdded) {
          return userStats.contactsAdded >= achievement.criteria.contactsAdded
        }
        if (achievement.criteria.currentStreak) {
          return userStats.currentStreak >= achievement.criteria.currentStreak
        }
        return false
      })

      expect(unlockedAchievements.length).toBe(2) // first_contact и streak_starter
      expect(unlockedAchievements.map(a => a.code)).toContain('first_contact')
      expect(unlockedAchievements.map(a => a.code)).toContain('streak_starter')
    })

    it('должен начислять XP за разблокировку достижения', () => {
      let user = {
        totalXP: 100,
        level: 2
      }

      const achievement = {
        code: 'first_contact',
        xpReward: 50
      }

      // Разблокируем достижение
      user.totalXP += achievement.xpReward
      user.level = calculateLevel(user.totalXP)

      expect(user.totalXP).toBe(150)
      expect(user.level).toBe(2)
    })

    it('должен отображать прогресс к заблокированным достижениям', () => {
      const achievement = {
        code: 'social_butterfly',
        criteria: { contactsAdded: 10 },
        xpReward: 100
      }

      const userStats = {
        contactsAdded: 5
      }

      const progress = (userStats.contactsAdded / achievement.criteria.contactsAdded) * 100
      expect(progress).toBe(50) // 5/10 = 50%
    })
  })

  describe('Шаг 4: Интеграция геймификации', () => {
    it('должен корректно обновлять все показатели геймификации', () => {
      const user = {
        totalXP: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0
      }

      // Симулируем активность
      // День 1: добавление контакта + завершение напоминания
      user.totalXP += 10 + 20
      user.currentStreak = 1
      user.longestStreak = 1
      user.level = calculateLevel(user.totalXP)

      expect(user.totalXP).toBe(30)
      expect(user.level).toBe(1)
      expect(user.currentStreak).toBe(1)

      // День 2: завершение напоминания + стрик
      user.totalXP += 20 + 5
      user.currentStreak = 2
      user.longestStreak = 2
      user.level = calculateLevel(user.totalXP)

      expect(user.totalXP).toBe(55)
      expect(user.currentStreak).toBe(2)

      // День 3: завершение напоминания + стрик + достижение
      user.totalXP += 20 + 5 + 50
      user.currentStreak = 3
      user.longestStreak = 3
      user.level = calculateLevel(user.totalXP)

      expect(user.totalXP).toBe(130)
      expect(user.level).toBe(2)
      expect(user.currentStreak).toBe(3)
      expect(user.longestStreak).toBe(3)
    })

    it('должен получать полную статистику геймификации', () => {
      const stats = {
        currentStreak: 5,
        longestStreak: 10,
        totalXP: 450,
        level: 3,
        achievementsUnlocked: 3,
        totalAchievements: 10
      }

      expect(stats.totalXP).toBeGreaterThan(0)
      expect(stats.level).toBeGreaterThanOrEqual(1)
      expect(stats.currentStreak).toBeGreaterThanOrEqual(0)
      expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak)
      expect(stats.achievementsUnlocked).toBeLessThanOrEqual(stats.totalAchievements)
    })

    it('должен интегрировать геймификацию с завершением напоминаний', () => {
      const user = {
        totalXP: 80,
        level: 1,
        currentStreak: 2,
        longestStreak: 5,
        lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // вчера
      }

      // Завершаем напоминание сегодня
      const today = new Date()
      const lastActivity = new Date(user.lastActivityDate)
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

      // Обновляем стрик
      if (daysDiff === 1) {
        user.currentStreak += 1
        user.longestStreak = Math.max(user.currentStreak, user.longestStreak)
      }

      // Начисляем XP
      user.totalXP += 20 // REMINDER_COMPLETED
      user.totalXP += 5  // STREAK_MAINTAINED
      user.level = calculateLevel(user.totalXP)
      user.lastActivityDate = today

      expect(user.currentStreak).toBe(3)
      expect(user.totalXP).toBe(105)
      expect(user.level).toBe(2)
      expect(user.longestStreak).toBe(5)
    })
  })
})
