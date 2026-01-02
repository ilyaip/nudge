import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Unit тесты для webhook endpoint
 * 
 * Тестируют основную функциональность обработки webhook от Telegram Bot:
 * - Парсинг команд
 * - Валидацию запросов
 * - Обработку команд завершения
 */

describe('Webhook API', () => {
  describe('Парсинг команд', () => {
    it('должен распознать команду /done без параметров', () => {
      const text = '/done'
      const result = parseCommand(text)
      
      expect(result).toEqual({
        type: 'complete'
      })
    })

    it('должен распознать команду /complete без параметров', () => {
      const text = '/complete'
      const result = parseCommand(text)
      
      expect(result).toEqual({
        type: 'complete'
      })
    })

    it('должен распознать команду с username', () => {
      const text = '/done @ivan'
      const result = parseCommand(text)
      
      expect(result).toEqual({
        type: 'complete',
        contactUsername: 'ivan'
      })
    })

    it('должен распознать команду с именем контакта', () => {
      const text = '/done Иван Петров'
      const result = parseCommand(text)
      
      expect(result).toEqual({
        type: 'complete',
        contactName: 'Иван Петров'
      })
    })

    it('должен вернуть null для неизвестной команды', () => {
      const text = '/start'
      const result = parseCommand(text)
      
      expect(result).toBeNull()
    })

    it('должен вернуть null для обычного текста', () => {
      const text = 'Привет, как дела?'
      const result = parseCommand(text)
      
      expect(result).toBeNull()
    })

    it('должен обрабатывать команды в разном регистре', () => {
      const text = '/DONE @IVAN'
      const result = parseCommand(text)
      
      expect(result).toEqual({
        type: 'complete',
        contactUsername: 'IVAN'
      })
    })

    it('должен удалять @ из имени контакта', () => {
      const text = '/done @Иван @Петров'
      const result = parseCommand(text)
      
      expect(result).toEqual({
        type: 'complete',
        contactName: 'Иван Петров'
      })
    })
  })

  describe('Валидация webhook', () => {
    it('должен отклонить запрос без message', () => {
      const payload = {
        update_id: 123
      }
      
      expect(() => validateWebhookPayload(payload)).toThrow('Invalid webhook payload')
    })

    it('должен принять валидный payload', () => {
      const payload = {
        update_id: 123,
        message: {
          message_id: 1,
          from: {
            id: 123456789,
            is_bot: false,
            first_name: 'Test'
          },
          chat: {
            id: 123456789,
            type: 'private'
          },
          date: 1234567890,
          text: '/done'
        }
      }
      
      expect(() => validateWebhookPayload(payload)).not.toThrow()
    })
  })

  describe('Форматирование ответов', () => {
    it('должен форматировать ответ для одного напоминания', () => {
      const message = formatCompletionMessage(1)
      expect(message).toBe('Напоминание успешно выполнено!')
    })

    it('должен форматировать ответ для нескольких напоминаний', () => {
      const message = formatCompletionMessage(3)
      expect(message).toBe('Выполнено напоминаний: 3')
    })

    it('должен форматировать ответ для нуля напоминаний', () => {
      const message = formatCompletionMessage(0)
      expect(message).toBe('Нет невыполненных напоминаний на сегодня')
    })
  })
})

/**
 * Вспомогательные функции для тестирования
 * (копии функций из webhook.post.ts для изолированного тестирования)
 */

interface CompleteCommand {
  type: 'complete'
  contactName?: string
  contactUsername?: string
}

function parseCommand(text: string): CompleteCommand | null {
  const lowerText = text.toLowerCase()
  
  if (lowerText.startsWith('/done') || lowerText.startsWith('/complete')) {
    const usernameMatch = text.match(/@(\w+)/)
    
    if (usernameMatch) {
      return {
        type: 'complete',
        contactUsername: usernameMatch[1]
      }
    }
    
    const parts = text.split(/\s+/)
    if (parts.length > 1) {
      const contactName = parts.slice(1).join(' ').replace(/@/g, '').trim()
      if (contactName) {
        return {
          type: 'complete',
          contactName
        }
      }
    }
    
    return {
      type: 'complete'
    }
  }
  
  return null
}

function validateWebhookPayload(payload: any): void {
  if (!payload || !payload.message) {
    throw new Error('Invalid webhook payload')
  }
}

function formatCompletionMessage(count: number): string {
  if (count === 0) {
    return 'Нет невыполненных напоминаний на сегодня'
  }
  
  if (count === 1) {
    return 'Напоминание успешно выполнено!'
  }
  
  return `Выполнено напоминаний: ${count}`
}
