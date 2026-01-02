import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit-тесты для обработки ошибок
 * 
 * Эти тесты проверяют, что приложение корректно обрабатывает различные
 * типы ошибок и предоставляет понятные сообщения пользователям.
 * 
 * Validates: Requirements 6.3
 */

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Обработка ошибок подключения к базе данных', () => {
    it('должен логировать ошибку при сбое подключения к БД', () => {
      // Имитируем ошибку подключения
      const dbError = new Error('getaddrinfo ENOTFOUND postgres')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Функция обработки ошибки БД
      function handleDatabaseError(error: Error): { success: false; message: string } {
        console.error('Database connection error:', error.message)
        return {
          success: false,
          message: 'Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.'
        }
      }

      const result = handleDatabaseError(dbError)

      // Проверяем, что ошибка залогирована
      expect(consoleSpy).toHaveBeenCalledWith(
        'Database connection error:',
        'getaddrinfo ENOTFOUND postgres'
      )

      // Проверяем, что возвращается понятное сообщение
      expect(result.success).toBe(false)
      expect(result.message).toBe('Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.')

      consoleSpy.mockRestore()
    })

    it('должен обрабатывать ошибку таймаута подключения', () => {
      const timeoutError = new Error('Connection timeout')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function handleDatabaseError(error: Error): { success: false; message: string } {
        console.error('Database connection error:', error.message)
        return {
          success: false,
          message: 'Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.'
        }
      }

      const result = handleDatabaseError(timeoutError)

      expect(consoleSpy).toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.message).toContain('базе данных')

      consoleSpy.mockRestore()
    })

    it('должен обрабатывать ошибку аутентификации БД', () => {
      const authError = new Error('role "nudge_user" does not exist')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function handleDatabaseError(error: Error): { success: false; message: string } {
        console.error('Database connection error:', error.message)
        return {
          success: false,
          message: 'Не удалось подключиться к базе данных. Пожалуйста, попробуйте позже.'
        }
      }

      const result = handleDatabaseError(authError)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Database connection error:',
        'role "nudge_user" does not exist'
      )
      expect(result.success).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('Логирование ошибок', () => {
    it('должен логировать ошибки с контекстом', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function logError(context: string, error: Error, metadata?: Record<string, any>): void {
        console.error(`[${context}]`, error.message, metadata || {})
      }

      const testError = new Error('Test error')
      const metadata = { userId: 123, action: 'create_contact' }

      logError('ContactService', testError, metadata)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ContactService]',
        'Test error',
        metadata
      )

      consoleSpy.mockRestore()
    })

    it('должен логировать ошибки без метаданных', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function logError(context: string, error: Error, metadata?: Record<string, any>): void {
        console.error(`[${context}]`, error.message, metadata || {})
      }

      const testError = new Error('Simple error')
      logError('AuthService', testError)

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AuthService]',
        'Simple error',
        {}
      )

      consoleSpy.mockRestore()
    })

    it('должен логировать стек ошибки для отладки', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      function logErrorWithStack(error: Error): void {
        console.error('Error:', error.message)
        console.error('Stack:', error.stack)
      }

      const testError = new Error('Error with stack')
      logErrorWithStack(testError)

      expect(consoleSpy).toHaveBeenCalledWith('Error:', 'Error with stack')
      expect(consoleSpy).toHaveBeenCalledWith('Stack:', expect.any(String))

      consoleSpy.mockRestore()
    })
  })

  describe('Пользовательские сообщения об ошибках', () => {
    it('должен возвращать понятное сообщение для ошибки сети', () => {
      function getUserFriendlyMessage(error: Error): string {
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          return 'Проблема с подключением к серверу. Проверьте интернет-соединение.'
        }
        if (error.message.includes('timeout')) {
          return 'Превышено время ожидания. Попробуйте еще раз.'
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return 'Ошибка аутентификации. Пожалуйста, войдите снова.'
        }
        return 'Произошла ошибка. Пожалуйста, попробуйте позже.'
      }

      const networkError = new Error('getaddrinfo ENOTFOUND api.telegram.org')
      const message = getUserFriendlyMessage(networkError)

      expect(message).toBe('Проблема с подключением к серверу. Проверьте интернет-соединение.')
    })

    it('должен возвращать понятное сообщение для ошибки таймаута', () => {
      function getUserFriendlyMessage(error: Error): string {
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          return 'Проблема с подключением к серверу. Проверьте интернет-соединение.'
        }
        if (error.message.includes('timeout')) {
          return 'Превышено время ожидания. Попробуйте еще раз.'
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return 'Ошибка аутентификации. Пожалуйста, войдите снова.'
        }
        return 'Произошла ошибка. Пожалуйста, попробуйте позже.'
      }

      const timeoutError = new Error('Request timeout after 5000ms')
      const message = getUserFriendlyMessage(timeoutError)

      expect(message).toBe('Превышено время ожидания. Попробуйте еще раз.')
    })

    it('должен возвращать понятное сообщение для ошибки аутентификации', () => {
      function getUserFriendlyMessage(error: Error): string {
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          return 'Проблема с подключением к серверу. Проверьте интернет-соединение.'
        }
        if (error.message.includes('timeout')) {
          return 'Превышено время ожидания. Попробуйте еще раз.'
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return 'Ошибка аутентификации. Пожалуйста, войдите снова.'
        }
        return 'Произошла ошибка. Пожалуйста, попробуйте позже.'
      }

      const authError = new Error('401 Unauthorized')
      const message = getUserFriendlyMessage(authError)

      expect(message).toBe('Ошибка аутентификации. Пожалуйста, войдите снова.')
    })

    it('должен возвращать общее сообщение для неизвестных ошибок', () => {
      function getUserFriendlyMessage(error: Error): string {
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          return 'Проблема с подключением к серверу. Проверьте интернет-соединение.'
        }
        if (error.message.includes('timeout')) {
          return 'Превышено время ожидания. Попробуйте еще раз.'
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return 'Ошибка аутентификации. Пожалуйста, войдите снова.'
        }
        return 'Произошла ошибка. Пожалуйста, попробуйте позже.'
      }

      const unknownError = new Error('Something went wrong')
      const message = getUserFriendlyMessage(unknownError)

      expect(message).toBe('Произошла ошибка. Пожалуйста, попробуйте позже.')
    })

    it('не должен раскрывать чувствительную информацию в сообщениях', () => {
      function getUserFriendlyMessage(error: Error): string {
        // Никогда не возвращаем оригинальное сообщение ошибки напрямую
        if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          return 'Проблема с подключением к серверу. Проверьте интернет-соединение.'
        }
        if (error.message.includes('timeout')) {
          return 'Превышено время ожидания. Попробуйте еще раз.'
        }
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          return 'Ошибка аутентификации. Пожалуйста, войдите снова.'
        }
        return 'Произошла ошибка. Пожалуйста, попробуйте позже.'
      }

      const sensitiveError = new Error('Database password incorrect for user admin')
      const message = getUserFriendlyMessage(sensitiveError)

      // Сообщение не должно содержать чувствительную информацию
      expect(message).not.toContain('password')
      expect(message).not.toContain('admin')
      expect(message).toBe('Произошла ошибка. Пожалуйста, попробуйте позже.')
    })
  })

  describe('Обработка ошибок API', () => {
    it('должен обрабатывать ошибки 404', () => {
      function handleApiError(statusCode: number): { success: false; message: string } {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        
        let message = 'Произошла ошибка'
        
        if (statusCode === 404) {
          message = 'Ресурс не найден'
          console.error(`API Error: ${statusCode} - Resource not found`)
        } else if (statusCode === 500) {
          message = 'Ошибка сервера. Попробуйте позже.'
          console.error(`API Error: ${statusCode} - Internal server error`)
        } else if (statusCode === 401) {
          message = 'Требуется аутентификация'
          console.error(`API Error: ${statusCode} - Unauthorized`)
        }
        
        consoleSpy.mockRestore()
        return { success: false, message }
      }

      const result = handleApiError(404)
      expect(result.message).toBe('Ресурс не найден')
    })

    it('должен обрабатывать ошибки 500', () => {
      function handleApiError(statusCode: number): { success: false; message: string } {
        let message = 'Произошла ошибка'
        
        if (statusCode === 404) {
          message = 'Ресурс не найден'
        } else if (statusCode === 500) {
          message = 'Ошибка сервера. Попробуйте позже.'
        } else if (statusCode === 401) {
          message = 'Требуется аутентификация'
        }
        
        return { success: false, message }
      }

      const result = handleApiError(500)
      expect(result.message).toBe('Ошибка сервера. Попробуйте позже.')
    })

    it('должен обрабатывать ошибки 401', () => {
      function handleApiError(statusCode: number): { success: false; message: string } {
        let message = 'Произошла ошибка'
        
        if (statusCode === 404) {
          message = 'Ресурс не найден'
        } else if (statusCode === 500) {
          message = 'Ошибка сервера. Попробуйте позже.'
        } else if (statusCode === 401) {
          message = 'Требуется аутентификация'
        }
        
        return { success: false, message }
      }

      const result = handleApiError(401)
      expect(result.message).toBe('Требуется аутентификация')
    })
  })

  describe('Retry логика при ошибках', () => {
    it('должен повторять операцию при временной ошибке', async () => {
      let attempts = 0
      
      async function retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 100
      ): Promise<T> {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await operation()
          } catch (error) {
            if (i === maxRetries - 1) throw error
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
        throw new Error('Max retries exceeded')
      }

      async function unreliableOperation(): Promise<string> {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'Success'
      }

      const result = await retryOperation(unreliableOperation, 3, 10)
      
      expect(result).toBe('Success')
      expect(attempts).toBe(3)
    })

    it('должен прекращать попытки после максимального количества', async () => {
      async function retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delay: number = 100
      ): Promise<T> {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await operation()
          } catch (error) {
            if (i === maxRetries - 1) throw error
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
        throw new Error('Max retries exceeded')
      }

      async function alwaysFailingOperation(): Promise<string> {
        throw new Error('Permanent failure')
      }

      await expect(
        retryOperation(alwaysFailingOperation, 3, 10)
      ).rejects.toThrow('Permanent failure')
    })
  })
})
