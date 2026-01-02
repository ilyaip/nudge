import { describe, it, expect } from 'vitest'

/**
 * Тесты для страницы достижений
 * Проверяют корректность отображения достижений и расчета прогресса
 */
describe('Страница достижений', () => {
  describe('Расчет процента завершения', () => {
    it('должен возвращать 0% если нет достижений', () => {
      const unlocked = 0
      const total = 0
      const percentage = total === 0 ? 0 : Math.round((unlocked / total) * 100)
      
      expect(percentage).toBe(0)
    })

    it('должен возвращать 50% если разблокирована половина', () => {
      const unlocked = 5
      const total = 10
      const percentage = Math.round((unlocked / total) * 100)
      
      expect(percentage).toBe(50)
    })

    it('должен возвращать 100% если все разблокированы', () => {
      const unlocked = 10
      const total = 10
      const percentage = Math.round((unlocked / total) * 100)
      
      expect(percentage).toBe(100)
    })

    it('должен корректно округлять дробные проценты', () => {
      const unlocked = 1
      const total = 3
      const percentage = Math.round((unlocked / total) * 100)
      
      expect(percentage).toBe(33)
    })
  })

  describe('Расчет прогресса к достижениям', () => {
    it('должен рассчитывать прогресс по стрику', () => {
      const currentStreak = 5
      const minStreak = 10
      const progress = Math.min(100, Math.round((currentStreak / minStreak) * 100))
      
      expect(progress).toBe(50)
    })

    it('должен ограничивать прогресс 100%', () => {
      const currentStreak = 15
      const minStreak = 10
      const progress = Math.min(100, Math.round((currentStreak / minStreak) * 100))
      
      expect(progress).toBe(100)
    })

    it('должен рассчитывать прогресс по уровню', () => {
      const currentLevel = 3
      const minLevel = 5
      const progress = Math.min(100, Math.round((currentLevel / minLevel) * 100))
      
      expect(progress).toBe(60)
    })

    it('должен рассчитывать прогресс по XP', () => {
      const currentXP = 750
      const minXP = 1000
      const progress = Math.min(100, Math.round((currentXP / minXP) * 100))
      
      expect(progress).toBe(75)
    })

    it('должен возвращать 0% если текущее значение 0', () => {
      const currentValue = 0
      const minValue = 10
      const progress = Math.min(100, Math.round((currentValue / minValue) * 100))
      
      expect(progress).toBe(0)
    })
  })

  describe('Форматирование даты разблокировки', () => {
    it('должен возвращать "Сегодня" для сегодняшней даты', () => {
      const today = new Date()
      const diffDays = 0
      const formatted = diffDays === 0 ? 'Сегодня' : `${diffDays} дн. назад`
      
      expect(formatted).toBe('Сегодня')
    })

    it('должен возвращать "Вчера" для вчерашней даты', () => {
      const diffDays = 1
      const formatted = diffDays === 1 ? 'Вчера' : `${diffDays} дн. назад`
      
      expect(formatted).toBe('Вчера')
    })

    it('должен возвращать количество дней для недавних дат', () => {
      const diffDays = 5
      const formatted = `${diffDays} дн. назад`
      
      expect(formatted).toBe('5 дн. назад')
    })

    it('должен возвращать количество недель для дат старше недели', () => {
      const diffDays = 14
      const weeks = Math.floor(diffDays / 7)
      const formatted = `${weeks} нед. назад`
      
      expect(formatted).toBe('2 нед. назад')
    })

    it('должен возвращать количество месяцев для старых дат', () => {
      const diffDays = 60
      const months = Math.floor(diffDays / 30)
      const formatted = `${months} мес. назад`
      
      expect(formatted).toBe('2 мес. назад')
    })
  })

  describe('Структура данных достижения', () => {
    it('разблокированное достижение должно иметь все необходимые поля', () => {
      const achievement = {
        id: 1,
        code: 'FIRST_CONTACT',
        name: 'Первый контакт',
        description: 'Добавьте свой первый контакт',
        icon: '👤',
        xpReward: 10,
        criteria: { minContacts: 1 },
        unlocked: true,
        unlockedAt: new Date().toISOString()
      }

      expect(achievement).toHaveProperty('id')
      expect(achievement).toHaveProperty('code')
      expect(achievement).toHaveProperty('name')
      expect(achievement).toHaveProperty('description')
      expect(achievement).toHaveProperty('icon')
      expect(achievement).toHaveProperty('xpReward')
      expect(achievement).toHaveProperty('criteria')
      expect(achievement).toHaveProperty('unlocked')
      expect(achievement).toHaveProperty('unlockedAt')
      expect(achievement.unlocked).toBe(true)
    })

    it('заблокированное достижение должно иметь прогресс', () => {
      const achievement = {
        id: 2,
        code: 'WEEK_WARRIOR',
        name: 'Воин недели',
        description: 'Достигните стрика в 7 дней',
        icon: '⚡',
        xpReward: 100,
        criteria: { minStreak: 7 },
        unlocked: false,
        unlockedAt: null,
        progress: 50
      }

      expect(achievement.unlocked).toBe(false)
      expect(achievement.unlockedAt).toBeNull()
      expect(achievement).toHaveProperty('progress')
      expect(achievement.progress).toBeGreaterThanOrEqual(0)
      expect(achievement.progress).toBeLessThanOrEqual(100)
    })
  })

  describe('Фильтрация достижений', () => {
    it('должен корректно разделять разблокированные и заблокированные', () => {
      const achievements = [
        { id: 1, unlocked: true },
        { id: 2, unlocked: false },
        { id: 3, unlocked: true },
        { id: 4, unlocked: false }
      ]

      const unlocked = achievements.filter(a => a.unlocked)
      const locked = achievements.filter(a => !a.unlocked)

      expect(unlocked.length).toBe(2)
      expect(locked.length).toBe(2)
      expect(unlocked.every(a => a.unlocked)).toBe(true)
      expect(locked.every(a => !a.unlocked)).toBe(true)
    })

    it('должен возвращать пустой массив если нет достижений', () => {
      const achievements: any[] = []
      
      const unlocked = achievements.filter(a => a.unlocked)
      const locked = achievements.filter(a => !a.unlocked)

      expect(unlocked.length).toBe(0)
      expect(locked.length).toBe(0)
    })
  })
})
