import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac } from 'crypto'

describe('API аутентификации', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Валидация Telegram initData', () => {
    it('должен валидировать корректную подпись HMAC-SHA256', () => {
      const botToken = 'test_bot_token_123'
      const userData = JSON.stringify({
        id: 12345,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      })
      
      // Создаем валидные initData
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
      
      // Валидируем
      const isValid = validateTelegramInitData(initData, botToken)
      expect(isValid).toBe(true)
    })

    it('должен отклонять неверную подпись', () => {
      const botToken = 'test_bot_token_123'
      const userData = JSON.stringify({
        id: 12345,
        first_name: 'Test'
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

    it('должен отклонять initData без hash', () => {
      const botToken = 'test_bot_token_123'
      const params = new URLSearchParams({
        user: JSON.stringify({ id: 12345 }),
        auth_date: Math.floor(Date.now() / 1000).toString()
      })
      
      const initData = params.toString()
      const isValid = validateTelegramInitData(initData, botToken)
      expect(isValid).toBe(false)
    })
  })
})

// Вспомогательная функция, извлеченная из auth.post.ts для тестирования
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
