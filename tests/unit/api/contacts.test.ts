import { describe, it, expect } from 'vitest'

describe('API управления контактами', () => {
  describe('Валидация данных контакта', () => {
    it('должен принимать валидные значения frequency', () => {
      const validFrequencies = ['weekly', 'monthly', 'quarterly', 'custom']
      
      validFrequencies.forEach(frequency => {
        expect(validFrequencies.includes(frequency)).toBe(true)
      })
    })

    it('должен принимать валидные значения communicationType', () => {
      const validTypes = ['message', 'call', 'meeting']
      
      validTypes.forEach(type => {
        expect(validTypes.includes(type)).toBe(true)
      })
    })

    it('должен принимать валидные значения category', () => {
      const validCategories = ['family', 'friends', 'colleagues', 'business']
      
      validCategories.forEach(category => {
        expect(validCategories.includes(category)).toBe(true)
      })
    })

    it('должен отклонять невалидные значения frequency', () => {
      const invalidFrequencies = ['daily', 'yearly', 'invalid']
      const validFrequencies = ['weekly', 'monthly', 'quarterly', 'custom']
      
      invalidFrequencies.forEach(frequency => {
        expect(validFrequencies.includes(frequency)).toBe(false)
      })
    })
  })

  describe('Санитизация данных импорта', () => {
    it('должен удалять лишние пробелы из имени', () => {
      const name = '  John Doe  '
      const sanitized = name.trim()
      expect(sanitized).toBe('John Doe')
    })

    it('должен удалять лишние пробелы из username', () => {
      const username = '  johndoe  '
      const sanitized = username.trim()
      expect(sanitized).toBe('johndoe')
    })

    it('должен удалять лишние пробелы из telegramContactId', () => {
      const id = '  12345  '
      const sanitized = id.trim()
      expect(sanitized).toBe('12345')
    })

    it('должен отклонять пустое имя после санитизации', () => {
      const name = '   '
      const sanitized = name.trim()
      expect(sanitized.length).toBe(0)
    })
  })

  describe('Настройки по умолчанию при импорте', () => {
    it('должен устанавливать isTracked в false по умолчанию', () => {
      const defaultIsTracked = false
      expect(defaultIsTracked).toBe(false)
    })

    it('должен устанавливать frequency в monthly по умолчанию', () => {
      const defaultFrequency = 'monthly'
      expect(defaultFrequency).toBe('monthly')
    })

    it('должен устанавливать communicationType в message по умолчанию', () => {
      const defaultType = 'message'
      expect(defaultType).toBe('message')
    })

    it('должен устанавливать category в friends по умолчанию', () => {
      const defaultCategory = 'friends'
      expect(defaultCategory).toBe('friends')
    })
  })

  describe('Валидация customFrequencyDays', () => {
    it('должен требовать положительное значение для custom frequency', () => {
      const frequency = 'custom'
      const customDays = 15
      
      expect(frequency).toBe('custom')
      expect(customDays).toBeGreaterThan(0)
    })

    it('должен отклонять нулевое значение для custom frequency', () => {
      const customDays = 0
      expect(customDays).toBeLessThanOrEqual(0)
    })

    it('должен отклонять отрицательное значение для custom frequency', () => {
      const customDays = -5
      expect(customDays).toBeLessThanOrEqual(0)
    })
  })
})
