import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAchievementModal, type Achievement } from '~/composables/useAchievementModal'

/**
 * Тесты для composable управления модальным окном достижений
 */
describe('useAchievementModal', () => {
  // Тестовые данные
  const mockAchievement1: Achievement = {
    id: 1,
    code: 'FIRST_CONTACT',
    name: 'Первый контакт',
    description: 'Добавьте свой первый контакт',
    icon: '👤',
    xpReward: 10
  }

  const mockAchievement2: Achievement = {
    id: 2,
    code: 'WEEK_WARRIOR',
    name: 'Воин недели',
    description: 'Достигните стрика в 7 дней',
    icon: '⚡',
    xpReward: 100
  }

  beforeEach(() => {
    // Очищаем состояние перед каждым тестом
    const { clearQueue } = useAchievementModal()
    clearQueue()
  })

  describe('Показ одного достижения', () => {
    it('должен установить текущее достижение при вызове showAchievement', () => {
      const { showAchievement, currentAchievement, isShowing } = useAchievementModal()
      
      showAchievement(mockAchievement1)
      
      expect(currentAchievement.value).toEqual(mockAchievement1)
      expect(isShowing.value).toBe(true)
    })

    it('должен добавить достижение в очередь если модалка уже показывается', () => {
      const { showAchievement, queueLength } = useAchievementModal()
      
      // Показываем первое достижение
      showAchievement(mockAchievement1)
      
      // Пытаемся показать второе - должно попасть в очередь
      showAchievement(mockAchievement2)
      
      expect(queueLength.value.length).toBe(1)
      expect(queueLength.value[0]).toEqual(mockAchievement2)
    })
  })

  describe('Показ нескольких достижений', () => {
    it('должен добавить все достижения в очередь', () => {
      const { showAchievements, queueLength } = useAchievementModal()
      
      const achievements = [mockAchievement1, mockAchievement2]
      showAchievements(achievements)
      
      // Первое должно показаться, второе в очереди
      expect(queueLength.value.length).toBe(1)
    })

    it('не должен ничего делать если массив пустой', () => {
      const { showAchievements, currentAchievement, isShowing } = useAchievementModal()
      
      showAchievements([])
      
      expect(currentAchievement.value).toBeNull()
      expect(isShowing.value).toBe(false)
    })
  })

  describe('Закрытие модалки', () => {
    it('должен показать следующее достижение из очереди при закрытии', async () => {
      const { showAchievements, handleClose, currentAchievement } = useAchievementModal()
      
      // Добавляем два достижения
      showAchievements([mockAchievement1, mockAchievement2])
      
      // Первое должно показаться
      expect(currentAchievement.value).toEqual(mockAchievement1)
      
      // Закрываем и ждем
      handleClose()
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Второе должно показаться
      expect(currentAchievement.value).toEqual(mockAchievement2)
    })

    it('должен очистить состояние если очередь пуста', async () => {
      const { showAchievement, handleClose, currentAchievement, isShowing } = useAchievementModal()
      
      // Показываем одно достижение
      showAchievement(mockAchievement1)
      
      // Закрываем
      handleClose()
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Состояние должно очиститься
      expect(currentAchievement.value).toBeNull()
      expect(isShowing.value).toBe(false)
    })
  })

  describe('Очистка очереди', () => {
    it('должен очистить все состояние', () => {
      const { showAchievements, clearQueue, currentAchievement, isShowing, queueLength } = useAchievementModal()
      
      // Добавляем достижения
      showAchievements([mockAchievement1, mockAchievement2])
      
      // Очищаем
      clearQueue()
      
      // Все должно быть пусто
      expect(currentAchievement.value).toBeNull()
      expect(isShowing.value).toBe(false)
      expect(queueLength.value.length).toBe(0)
    })
  })

  describe('Структура данных достижения', () => {
    it('достижение должно иметь все обязательные поля', () => {
      const achievement: Achievement = {
        id: 1,
        code: 'TEST',
        name: 'Test Achievement',
        description: 'Test description',
        icon: '🎯',
        xpReward: 50
      }

      expect(achievement).toHaveProperty('id')
      expect(achievement).toHaveProperty('code')
      expect(achievement).toHaveProperty('name')
      expect(achievement).toHaveProperty('description')
      expect(achievement).toHaveProperty('icon')
      expect(achievement).toHaveProperty('xpReward')
      
      expect(typeof achievement.id).toBe('number')
      expect(typeof achievement.code).toBe('string')
      expect(typeof achievement.name).toBe('string')
      expect(typeof achievement.description).toBe('string')
      expect(typeof achievement.icon).toBe('string')
      expect(typeof achievement.xpReward).toBe('number')
    })
  })
})
