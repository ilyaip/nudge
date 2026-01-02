import { describe, it, expect } from 'vitest'
import {
  getFrequencyInDays,
  calculateNextReminderDate,
  isContactDueForReminder,
  getContactsDueForReminder
} from '../../../server/utils/reminders'
import type { Contact } from '../../../server/db/schema'

describe('Reminders Utils', () => {
  describe('getFrequencyInDays', () => {
    it('должен возвращать 7 дней для weekly', () => {
      expect(getFrequencyInDays('weekly', null)).toBe(7)
    })

    it('должен возвращать 30 дней для monthly', () => {
      expect(getFrequencyInDays('monthly', null)).toBe(30)
    })

    it('должен возвращать 90 дней для quarterly', () => {
      expect(getFrequencyInDays('quarterly', null)).toBe(90)
    })

    it('должен возвращать пользовательское количество дней для custom', () => {
      expect(getFrequencyInDays('custom', 14)).toBe(14)
    })

    it('должен возвращать 30 дней по умолчанию для custom без customDays', () => {
      expect(getFrequencyInDays('custom', null)).toBe(30)
    })

    it('должен возвращать 30 дней для неизвестной частоты', () => {
      expect(getFrequencyInDays('unknown', null)).toBe(30)
    })
  })

  describe('calculateNextReminderDate', () => {
    it('должен рассчитывать дату на основе lastContactDate', () => {
      const contact: Partial<Contact> = {
        lastContactDate: new Date('2024-01-01'),
        createdAt: new Date('2023-12-01'),
        frequency: 'weekly',
        customFrequencyDays: null
      }

      const nextDate = calculateNextReminderDate(contact as Contact)
      expect(nextDate.toISOString().split('T')[0]).toBe('2024-01-08')
    })

    it('должен использовать createdAt если нет lastContactDate', () => {
      const contact: Partial<Contact> = {
        lastContactDate: null,
        createdAt: new Date('2024-01-01'),
        frequency: 'monthly',
        customFrequencyDays: null
      }

      const nextDate = calculateNextReminderDate(contact as Contact)
      expect(nextDate.toISOString().split('T')[0]).toBe('2024-01-31')
    })

    it('должен корректно работать с custom frequency', () => {
      const contact: Partial<Contact> = {
        lastContactDate: new Date('2024-01-01'),
        createdAt: new Date('2023-12-01'),
        frequency: 'custom',
        customFrequencyDays: 5
      }

      const nextDate = calculateNextReminderDate(contact as Contact)
      expect(nextDate.toISOString().split('T')[0]).toBe('2024-01-06')
    })
  })

  describe('isContactDueForReminder', () => {
    it('должен возвращать false для неотслеживаемого контакта', () => {
      const contact: Partial<Contact> = {
        isTracked: false,
        nextReminderDate: new Date('2024-01-01'),
        lastContactDate: new Date('2023-12-25'),
        createdAt: new Date('2023-12-01'),
        frequency: 'weekly',
        customFrequencyDays: null
      }

      expect(isContactDueForReminder(contact as Contact, new Date('2024-01-01'))).toBe(false)
    })

    it('должен возвращать true если nextReminderDate <= today', () => {
      const contact: Partial<Contact> = {
        isTracked: true,
        nextReminderDate: new Date('2024-01-01'),
        lastContactDate: new Date('2023-12-25'),
        createdAt: new Date('2023-12-01'),
        frequency: 'weekly',
        customFrequencyDays: null
      }

      expect(isContactDueForReminder(contact as Contact, new Date('2024-01-01'))).toBe(true)
      expect(isContactDueForReminder(contact as Contact, new Date('2024-01-02'))).toBe(true)
    })

    it('должен возвращать false если nextReminderDate > today', () => {
      const contact: Partial<Contact> = {
        isTracked: true,
        nextReminderDate: new Date('2024-01-10'),
        lastContactDate: new Date('2024-01-03'),
        createdAt: new Date('2023-12-01'),
        frequency: 'weekly',
        customFrequencyDays: null
      }

      expect(isContactDueForReminder(contact as Contact, new Date('2024-01-05'))).toBe(false)
    })

    it('должен рассчитывать nextReminderDate если его нет', () => {
      const contact: Partial<Contact> = {
        isTracked: true,
        nextReminderDate: null,
        lastContactDate: new Date('2024-01-01'),
        createdAt: new Date('2023-12-01'),
        frequency: 'weekly',
        customFrequencyDays: null
      }

      // nextReminderDate будет 2024-01-08 (01-01 + 7 дней)
      expect(isContactDueForReminder(contact as Contact, new Date('2024-01-08'))).toBe(true)
      expect(isContactDueForReminder(contact as Contact, new Date('2024-01-07'))).toBe(false)
    })
  })

  describe('getContactsDueForReminder', () => {
    it('должен возвращать только контакты, требующие напоминания', () => {
      const contacts: Partial<Contact>[] = [
        {
          id: 1,
          isTracked: true,
          nextReminderDate: new Date('2024-01-01'),
          lastContactDate: new Date('2023-12-25'),
          createdAt: new Date('2023-12-01'),
          frequency: 'weekly',
          customFrequencyDays: null
        },
        {
          id: 2,
          isTracked: true,
          nextReminderDate: new Date('2024-01-10'),
          lastContactDate: new Date('2024-01-03'),
          createdAt: new Date('2023-12-01'),
          frequency: 'weekly',
          customFrequencyDays: null
        },
        {
          id: 3,
          isTracked: false,
          nextReminderDate: new Date('2024-01-01'),
          lastContactDate: new Date('2023-12-25'),
          createdAt: new Date('2023-12-01'),
          frequency: 'weekly',
          customFrequencyDays: null
        }
      ]

      const dueContacts = getContactsDueForReminder(
        contacts as Contact[],
        new Date('2024-01-05')
      )

      expect(dueContacts).toHaveLength(1)
      expect(dueContacts[0].id).toBe(1)
    })

    it('должен возвращать пустой массив если нет контактов, требующих напоминания', () => {
      const contacts: Partial<Contact>[] = [
        {
          id: 1,
          isTracked: true,
          nextReminderDate: new Date('2024-01-10'),
          lastContactDate: new Date('2024-01-03'),
          createdAt: new Date('2023-12-01'),
          frequency: 'weekly',
          customFrequencyDays: null
        }
      ]

      const dueContacts = getContactsDueForReminder(
        contacts as Contact[],
        new Date('2024-01-05')
      )

      expect(dueContacts).toHaveLength(0)
    })
  })
})
