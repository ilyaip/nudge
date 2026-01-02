/**
 * Middleware для автоматической авторизации через Telegram Web App
 * Извлекает userId из Telegram initData и добавляет в контекст запроса
 */

import { createHmac } from 'crypto'

export default defineEventHandler(async (event) => {
  // Пропускаем health check и статические файлы
  const path = event.path
  if (path === '/api/health' || path === '/api/migrate' || !path.startsWith('/api/')) {
    return
  }

  try {
    // Получаем initData из заголовков или query параметров
    const initData = getHeader(event, 'x-telegram-init-data') || 
                     getQuery(event).initData as string

    if (!initData) {
      // В development режиме используем тестового пользователя
      if (process.env.NODE_ENV === 'development') {
        event.context.telegramUser = {
          id: 1,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser'
        }
        return
      }

      throw createError({
        statusCode: 401,
        statusMessage: 'Telegram authorization required'
      })
    }

    // Парсим initData
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    params.delete('hash')

    // Проверяем подпись (в production)
    if (process.env.NODE_ENV === 'production') {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || ''
      const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
      
      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n')
      
      const calculatedHash = createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex')

      if (calculatedHash !== hash) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Invalid Telegram authorization'
        })
      }
    }

    // Извлекаем данные пользователя
    const userJson = params.get('user')
    if (!userJson) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User data not found in initData'
      })
    }

    const telegramUser = JSON.parse(userJson)
    
    // Сохраняем пользователя в контексте запроса
    event.context.telegramUser = telegramUser
    
  } catch (error: any) {
    // В development режиме используем тестового пользователя при ошибке
    if (process.env.NODE_ENV === 'development') {
      event.context.telegramUser = {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser'
      }
      return
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Telegram auth error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed'
    })
  }
})
