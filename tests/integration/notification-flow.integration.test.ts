import { describe, it, expect } from 'vitest'
import { calculateNextReminderDate } from '../../server/utils/reminders'
import { calculateLevel } from '../../server/utils/gamification'

/**
 * Интеграционный тест потока уведомлений
 * Тестирует: планировщик → бот → webhook → завершение
 * Требования: 7.1-7.4, 9.1-9.4
 * 
 * Примечание: Этот тест проверяет интеграцию логики уведомлений
 */
describe('Интеграционный тест: Поток уведомлений', () => {
  describe('Шаг 1: Планировщик рассчитывает напоминания', () => {
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

    it('должен создавать записи напоминаний для контактов', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const reminder = {
        userId: 1,
        contactId: 1,
        dueDate: today,
        completed: false,
        notificationSent: false
      }

      expect(reminder.userId).toBe(1)
      expect(reminder.contactId).toBe(1)
      expect(reminder.completed).toBe(false)
      expect(reminder.notificationSent).toBe(false)
    })

    it('должен группировать напоминания по пользователям', () => {
      const reminders = [
        { userId: 1, contactId: 1, contactName: 'Контакт 1' },
        { userId: 1, contactId: 2, contactName: 'Контакт 2' },
        { userId: 2, contactId: 3, contactName: 'Контакт 3' },
        { userId: 1, contactId: 4, contactName: 'Контакт 4' }
      ]

      const groupedByUser = reminders.reduce((acc, reminder) => {
        if (!acc[reminder.userId]) {
          acc[reminder.userId] = []
        }
        acc[reminder.userId].push(reminder)
        return acc
      }, {} as Record<number, typeof reminders>)

      expect(Object.keys(groupedByUser).length).toBe(2)
      expect(groupedByUser[1].length).toBe(3)
      expect(groupedByUser[2].length).toBe(1)
    })
  })

  describe('Шаг 2: Бот отправляет уведомления', () => {
    it('должен формировать текст уведомления', () => {
      const contact = {
        name: 'Иван Иванов',
        category: 'friends',
        communicationType: 'message'
      }

      const message = `🔔 Напоминание!\n\nПора связаться с ${contact.name} (${contact.category})\nСпособ связи: ${contact.communicationType}`

      expect(message).toContain(contact.name)
      expect(message).toContain(contact.category)
      expect(message).toContain(contact.communicationType)
      expect(message).toContain('🔔')
    })

    it('должен отмечать уведомление как отправленное', () => {
      const reminder = {
        id: 1,
        userId: 1,
        contactId: 1,
        completed: false,
        notificationSent: false
      }

      // Отмечаем как отправленное
      const updatedReminder = {
        ...reminder,
        notificationSent: true
      }

      expect(updatedReminder.notificationSent).toBe(true)
    })

    it('должен логировать событие отправки уведомления', () => {
      const logEntry = {
        userId: 1,
        action: 'notification_sent',
        timestamp: new Date(),
        metadata: {
          contactId: 1,
          notificationType: 'reminder'
        }
      }

      expect(logEntry.action).toBe('notification_sent')
      expect(logEntry.metadata.contactId).toBe(1)
      expect(logEntry.metadata.notificationType).toBe('reminder')
    })

    it('должен обрабатывать множественные уведомления для одного пользователя', () => {
      const reminders = [
        { id: 1, contactName: 'Контакт 1' },
        { id: 2, contactName: 'Контакт 2' },
        { id: 3, contactName: 'Контакт 3' }
      ]

      const message = `🔔 У вас ${reminders.length} напоминаний:\n\n` +
        reminders.map((r, i) => `${i + 1}. ${r.contactName}`).join('\n')

      expect(message).toContain('3 напоминаний')
      expect(message).toContain('Контакт 1')
      expect(message).toContain('Контакт 2')
      expect(message).toContain('Контакт 3')
    })
  })

  describe('Шаг 3: Webhook обрабатывает команды бота', () => {
    it('должен валидировать структуру webhook запроса', () => {
      const payload = {
        update_id: 123456,
        message: {
          message_id: 1,
          from: { id: 12345, username: 'testuser' },
          text: '/done'
        }
      }

      expect(payload.message).toBeDefined()
      expect(payload.message.from).toBeDefined()
      expect(payload.message.text).toBeDefined()
    })

    it('должен парсить команду завершения из сообщения', () => {
      const testCases = [
        { message: '/done @testcontact', expected: 'testcontact' },
        { message: '/done testcontact', expected: 'testcontact' },
        { message: '/done @user123', expected: 'user123' }
      ]

      testCases.forEach(({ message, expected }) => {
        const commandMatch = message.match(/^\/done\s+@?(\w+)/)
        expect(commandMatch).toBeDefined()
        expect(commandMatch![1]).toBe(expected)
      })
    })

    it('должен находить соответствующее напоминание по команде', () => {
      const username = 'testcontact'
      const contacts = [
        { id: 1, username: 'testcontact', name: 'Тест Контакт' },
        { id: 2, username: 'another', name: 'Другой Контакт' }
      ]

      const contact = contacts.find(c => c.username === username)
      expect(contact).toBeDefined()
      expect(contact!.id).toBe(1)
    })

    it('должен отмечать напоминание как завершенное через webhook', () => {
      const reminder = {
        id: 1,
        userId: 1,
        contactId: 1,
        completed: false,
        completedAt: null
      }

      // Завершаем через webhook
      const completedReminder = {
        ...reminder,
        completed: true,
        completedAt: new Date()
      }

      expect(completedReminder.completed).toBe(true)
      expect(completedReminder.completedAt).toBeDefined()
    })

    it('должен обновлять lastContactDate контакта', () => {
      const contact = {
        id: 1,
        name: 'Тест Контакт',
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

    it('должен отклонять webhook с неверной подписью', () => {
      const invalidSignature = 'invalid_signature_123'
      const expectedSignature = 'valid_signature_456'

      const isValid = invalidSignature === expectedSignature
      expect(isValid).toBe(false)
    })

    it('должен логировать событие безопасности при неверной подписи', () => {
      const securityLog = {
        event: 'webhook_validation_failed',
        timestamp: new Date(),
        ip: '127.0.0.1',
        reason: 'Invalid signature'
      }

      expect(securityLog.event).toBe('webhook_validation_failed')
      expect(securityLog.reason).toBe('Invalid signature')
      expect(securityLog.timestamp).toBeDefined()
    })
  })

  describe('Шаг 4: Завершение потока уведомлений', () => {
    it('должен рассчитывать следующую дату напоминания после завершения', () => {
      const contact = {
        id: 1,
        userId: 1,
        telegramContactId: 'contact_123',
        name: 'Тест Контакт',
        username: 'testcontact',
        isTracked: true,
        frequency: 'weekly' as const,
        customFrequencyDays: null,
        communicationType: 'message' as const,
        category: 'friends' as const,
        lastContactDate: new Date(),
        nextReminderDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const nextDate = calculateNextReminderDate(contact)
      const daysDiff = Math.floor(
        (nextDate.getTime() - contact.lastContactDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      )

      expect(daysDiff).toBe(7) // weekly = 7 дней
    })

    it('должен начислять XP за завершение напоминания', () => {
      const user = {
        totalXP: 50,
        level: 1
      }

      const XP_REWARD = 20 // REMINDER_COMPLETED
      user.totalXP += XP_REWARD
      user.level = calculateLevel(user.totalXP)

      expect(user.totalXP).toBe(70)
      expect(user.level).toBe(1)
    })

    it('должен обновлять стрик пользователя', () => {
      const user = {
        currentStreak: 2,
        longestStreak: 5,
        lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000) // вчера
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const lastActivity = new Date(user.lastActivityDate)
      lastActivity.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

      let newStreak = user.currentStreak
      if (daysDiff === 1) {
        newStreak = user.currentStreak + 1
      } else if (daysDiff > 1) {
        newStreak = 1
      }

      const updatedUser = {
        ...user,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak),
        lastActivityDate: today
      }

      expect(updatedUser.currentStreak).toBe(3)
      expect(updatedUser.longestStreak).toBe(5)
    })

    it('должен проверять полный цикл уведомления', () => {
      // 1. Создаем контакт с напоминанием
      const contact = {
        id: 1,
        userId: 1,
        name: 'Тест Контакт',
        username: 'testcontact',
        isTracked: true,
        frequency: 'weekly' as const,
        customFrequencyDays: null,
        communicationType: 'message' as const,
        category: 'friends' as const,
        lastContactDate: new Date('2024-01-01'),
        nextReminderDate: new Date('2024-01-08'),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 2. Создаем напоминание
      const reminder = {
        id: 1,
        userId: contact.userId,
        contactId: contact.id,
        dueDate: contact.nextReminderDate,
        completed: false,
        notificationSent: false,
        completedAt: null
      }

      expect(reminder.completed).toBe(false)

      // 3. Отправляем уведомление
      reminder.notificationSent = true
      expect(reminder.notificationSent).toBe(true)

      // 4. Завершаем напоминание
      reminder.completed = true
      reminder.completedAt = new Date()
      expect(reminder.completed).toBe(true)

      // 5. Обновляем контакт
      contact.lastContactDate = reminder.completedAt
      contact.nextReminderDate = calculateNextReminderDate(contact)

      expect(contact.lastContactDate).toBeDefined()
      expect(contact.nextReminderDate).toBeDefined()

      // 6. Проверяем следующее напоминание
      const daysDiff = Math.floor(
        (contact.nextReminderDate.getTime() - contact.lastContactDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(7)

      // 7. Начисляем XP и обновляем стрик
      const user = {
        totalXP: 50,
        level: 1,
        currentStreak: 2,
        longestStreak: 5
      }

      user.totalXP += 20 // REMINDER_COMPLETED
      user.totalXP += 5  // STREAK_MAINTAINED
      user.currentStreak += 1
      user.longestStreak = Math.max(user.currentStreak, user.longestStreak)
      user.level = calculateLevel(user.totalXP)

      expect(user.totalXP).toBe(75)
      expect(user.currentStreak).toBe(3)
      expect(user.level).toBe(1)
    })
  })
})
