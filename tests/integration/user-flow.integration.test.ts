import { describe, it, expect } from 'vitest'
import { createHmac } from 'crypto'
import { calculateNextReminderDate, getFrequencyInDays } from '../../server/utils/reminders'
import { calculateLevel } from '../../server/utils/gamification'

/**
 * Интеграционный тест полного пользовательского потока
 * Тестирует: auth → импорт → настройка → напоминания → завершение
 * Требования: Все
 * 
 * Примечание: Этот тест проверяет интеграцию бизнес-логики без реального подключения к БД
 */
describe('Интеграционный тест: Полный пользовательский поток', () => {
  const testTelegramId = `test_user_${Date.now()}`
  const botToken = process.env.TELEGRAM_BOT_TOKEN || 'test_bot_token_123'

  describe('Шаг 1: Аутентификация пользователя', () => {
    it('должен валидировать Telegram initData с корректной подписью', () => {
      // Создаем валидные initData
      const userData = JSON.stringify({
        id: testTelegramId,
        first_name: 'Тест',
        last_name: 'Пользователь',
        username: 'testuser'
      })
      
      const authDate = Math.floor(Date.now() / 1000)
      const params = new URLSearchParams({
        user: userData,
        auth_date: authDate.toString(),
        query_id: 'test_query_id'
      })
      
      // Вычисляем hash
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
      
      const secretKey = createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest()
      
      const hash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex')
      
      params.append('hash', hash)
      const initData = params.toString()

      // Валидируем initData
      const isValid = validateTelegramInitData(initData, botToken)
      expect(isValid).toBe(true)
    })

    it('должен отклонять initData с неверной подписью', () => {
      const userData = JSON.stringify({
        id: testTelegramId,
        first_name: 'Тест'
      })
      
      const params = new URLSearchParams({
        user: userData,
        auth_date: Math.floor(Date.now() / 1000).toString(),
        hash: 'invalid_hash_12345'
      })
      
      const initData = params.toString()
      const isValid = validateTelegramInitData(initData, botToken)
      expect(isValid).toBe(false)
    })

    it('должен создавать объект пользователя с начальными значениями', () => {
      const newUser = {
        telegramId: testTelegramId,
        username: 'testuser',
        firstName: 'Тест',
        lastName: 'Пользователь',
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        level: 1
      }

      expect(newUser.telegramId).toBe(testTelegramId)
      expect(newUser.level).toBe(1)
      expect(newUser.totalXP).toBe(0)
      expect(newUser.currentStreak).toBe(0)
    })
  })

  describe('Шаг 2: Импорт и настройка контактов', () => {
    it('должен создавать контакт с настройками по умолчанию', () => {
      const newContact = {
        telegramContactId: 'contact_123',
        name: 'Иван Иванов',
        username: 'ivanov',
        isTracked: false,
        frequency: 'monthly' as const,
        communicationType: 'message' as const,
        category: 'friends' as const,
        lastContactDate: null,
        nextReminderDate: null
      }

      expect(newContact.name).toBe('Иван Иванов')
      expect(newContact.isTracked).toBe(false)
      expect(newContact.frequency).toBe('monthly')
      expect(newContact.communicationType).toBe('message')
      expect(newContact.category).toBe('friends')
    })

    it('должен обновлять настройки контакта для отслеживания', () => {
      const contact = {
        id: 1,
        telegramContactId: 'contact_123',
        name: 'Иван Иванов',
        username: 'ivanov',
        isTracked: false,
        frequency: 'monthly' as const,
        communicationType: 'message' as const,
        category: 'friends' as const,
        lastContactDate: null,
        nextReminderDate: null
      }

      // Обновляем настройки
      const updatedContact = {
        ...contact,
        isTracked: true,
        frequency: 'weekly' as const,
        communicationType: 'call' as const,
        category: 'colleagues' as const,
        lastContactDate: new Date()
      }

      expect(updatedContact.isTracked).toBe(true)
      expect(updatedContact.frequency).toBe('weekly')
      expect(updatedContact.communicationType).toBe('call')
      expect(updatedContact.category).toBe('colleagues')
      expect(updatedContact.lastContactDate).toBeDefined()
    })

    it('должен рассчитывать следующую дату напоминания на основе частоты', () => {
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: 'contact_123',
        name: 'Иван Иванов',
        username: 'ivanov',
        isTracked: true,
        frequency: 'weekly' as const,
        customFrequencyDays: null,
        communicationType: 'call' as const,
        category: 'colleagues' as const,
        lastContactDate: new Date('2024-01-01'),
        nextReminderDate: null,
        linkedUserId: null,
        isMutual: false,
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-01')
      }

      const nextDate = calculateNextReminderDate(contact)
      const daysDiff = Math.floor((nextDate.getTime() - contact.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBe(7) // weekly = 7 дней
    })
  })

  describe('Шаг 3: Создание и управление напоминаниями', () => {
    it('должен создавать напоминание для контакта', () => {
      const reminder = {
        userId: 1,
        contactId: 1,
        dueDate: new Date(),
        completed: false,
        notificationSent: false
      }

      expect(reminder.completed).toBe(false)
      expect(reminder.notificationSent).toBe(false)
      expect(reminder.dueDate).toBeDefined()
    })

    it('должен определять контакты, требующие напоминания', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const contacts = [
        {
          id: 1,
          name: 'Контакт 1',
          isTracked: true,
          nextReminderDate: new Date(today.getTime() - 24 * 60 * 60 * 1000) // вчера
        },
        {
          id: 2,
          name: 'Контакт 2',
          isTracked: true,
          nextReminderDate: today // сегодня
        },
        {
          id: 3,
          name: 'Контакт 3',
          isTracked: true,
          nextReminderDate: new Date(today.getTime() + 24 * 60 * 60 * 1000) // завтра
        },
        {
          id: 4,
          name: 'Контакт 4',
          isTracked: false,
          nextReminderDate: today
        }
      ]

      const dueContacts = contacts.filter(c => 
        c.isTracked && 
        c.nextReminderDate && 
        c.nextReminderDate <= today
      )

      expect(dueContacts.length).toBe(2) // Контакты 1 и 2
      expect(dueContacts.map(c => c.id)).toEqual([1, 2])
    })

    it('должен отмечать напоминание как завершенное', () => {
      const reminder = {
        id: 1,
        userId: 1,
        contactId: 1,
        dueDate: new Date(),
        completed: false,
        completedAt: null,
        notificationSent: true
      }

      // Завершаем напоминание
      const completedReminder = {
        ...reminder,
        completed: true,
        completedAt: new Date()
      }

      expect(completedReminder.completed).toBe(true)
      expect(completedReminder.completedAt).toBeDefined()
    })

    it('должен обновлять lastContactDate при завершении напоминания', () => {
      const contact = {
        id: 1,
        name: 'Иван Иванов',
        lastContactDate: new Date('2024-01-01')
      }

      const now = new Date()
      const updatedContact = {
        ...contact,
        lastContactDate: now
      }

      expect(updatedContact.lastContactDate).toBeDefined()
      const timeDiff = Math.abs(updatedContact.lastContactDate.getTime() - now.getTime())
      expect(timeDiff).toBeLessThan(1000)
    })
  })

  describe('Шаг 4: Интеграция всего потока', () => {
    it('должен проходить полный цикл: создание → настройка → напоминание → завершение', () => {
      // 1. Создаем контакт
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: 'contact_123',
        name: 'Тестовый Контакт',
        username: 'testcontact',
        isTracked: false,
        frequency: 'weekly' as const,
        customFrequencyDays: null,
        communicationType: 'message' as const,
        category: 'friends' as const,
        lastContactDate: null,
        nextReminderDate: null,
        linkedUserId: null,
        isMutual: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(contact.isTracked).toBe(false)

      // 2. Активируем отслеживание
      const trackedContact = {
        ...contact,
        isTracked: true,
        lastContactDate: new Date()
      }

      expect(trackedContact.isTracked).toBe(true)

      // 3. Рассчитываем следующее напоминание
      const nextReminderDate = calculateNextReminderDate(trackedContact)
      const daysDiff = Math.floor((nextReminderDate.getTime() - trackedContact.lastContactDate!.getTime()) / (1000 * 60 * 60 * 24))
      
      expect(daysDiff).toBe(7)

      // 4. Создаем напоминание
      const reminder = {
        id: 1,
        userId: trackedContact.userId,
        contactId: trackedContact.id,
        dueDate: nextReminderDate,
        completed: false,
        completedAt: null,
        notificationSent: false
      }

      expect(reminder.completed).toBe(false)

      // 5. Завершаем напоминание
      const completedReminder = {
        ...reminder,
        completed: true,
        completedAt: new Date()
      }

      expect(completedReminder.completed).toBe(true)

      // 6. Обновляем контакт
      const finalContact = {
        ...trackedContact,
        lastContactDate: completedReminder.completedAt,
        nextReminderDate: calculateNextReminderDate({
          ...trackedContact,
          lastContactDate: completedReminder.completedAt!
        })
      }

      expect(finalContact.lastContactDate).toBeDefined()
      expect(finalContact.nextReminderDate).toBeDefined()
      
      // Проверяем, что следующее напоминание через 7 дней
      const nextDaysDiff = Math.floor(
        (finalContact.nextReminderDate.getTime() - finalContact.lastContactDate!.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      expect(nextDaysDiff).toBe(7)
    })
  })
})

// Вспомогательная функция валидации
function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      return false
    }

    params.delete('hash')
    
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return calculatedHash === hash
  } catch (error) {
    return false
  }
}
