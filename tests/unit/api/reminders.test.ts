import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getFrequencyInDays, calculateNextReminderDate } from '../../../server/utils/reminders'

describe('Reminders API', () => {
  describe('Логика расчета напоминаний', () => {
    it('должен корректно рассчитывать следующую дату напоминания для weekly', () => {
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: '123',
        name: 'Тест',
        username: 'test',
        isTracked: true,
        frequency: 'weekly',
        customFrequencyDays: null,
        communicationType: 'message',
        category: 'friends',
        lastContactDate: new Date('2024-01-01'),
        nextReminderDate: null,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }

      const nextDate = calculateNextReminderDate(contact)
      const daysDiff = Math.floor((nextDate.getTime() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBe(7)
    })

    it('должен корректно рассчитывать следующую дату напоминания для monthly', () => {
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: '123',
        name: 'Тест',
        username: 'test',
        isTracked: true,
        frequency: 'monthly',
        customFrequencyDays: null,
        communicationType: 'message',
        category: 'friends',
        lastContactDate: new Date('2024-01-01'),
        nextReminderDate: null,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }

      const nextDate = calculateNextReminderDate(contact)
      const daysDiff = Math.floor((nextDate.getTime() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBe(30)
    })

    it('должен корректно рассчитывать следующую дату напоминания для quarterly', () => {
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: '123',
        name: 'Тест',
        username: 'test',
        isTracked: true,
        frequency: 'quarterly',
        customFrequencyDays: null,
        communicationType: 'message',
        category: 'friends',
        lastContactDate: new Date('2024-01-01'),
        nextReminderDate: null,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }

      const nextDate = calculateNextReminderDate(contact)
      const daysDiff = Math.floor((nextDate.getTime() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBe(90)
    })

    it('должен использовать customFrequencyDays для custom частоты', () => {
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: '123',
        name: 'Тест',
        username: 'test',
        isTracked: true,
        frequency: 'custom',
        customFrequencyDays: 14,
        communicationType: 'message',
        category: 'friends',
        lastContactDate: new Date('2024-01-01'),
        nextReminderDate: null,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }

      const nextDate = calculateNextReminderDate(contact)
      const daysDiff = Math.floor((nextDate.getTime() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBe(14)
    })
  })

  describe('Валидация частоты', () => {
    it('должен возвращать корректные значения для всех типов частоты', () => {
      expect(getFrequencyInDays('weekly', null)).toBe(7)
      expect(getFrequencyInDays('monthly', null)).toBe(30)
      expect(getFrequencyInDays('quarterly', null)).toBe(90)
      expect(getFrequencyInDays('custom', 21)).toBe(21)
    })

    it('должен использовать значение по умолчанию для неизвестной частоты', () => {
      expect(getFrequencyInDays('unknown', null)).toBe(30)
    })

    it('должен использовать значение по умолчанию для custom без customDays', () => {
      expect(getFrequencyInDays('custom', null)).toBe(30)
    })
  })
})
