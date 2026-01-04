/**
 * Middleware для автоматической авторизации через Telegram Web App
 * Извлекает userId из Telegram initData и добавляет в контекст запроса
 */

import { createHmac } from 'crypto'

export default defineEventHandler(async (event) => {
  // Пропускаем health check, миграции, webhook и статические файлы
  const path = event.path
  if (path === '/api/health' || 
      path === '/api/migrate' || 
      path === '/api/migrate-force' ||
      path === '/api/webhook/telegram' ||
      !path.startsWith('/api/')) {
    return
  }

  console.log('[Telegram Auth] Processing request:', path)

  try {
    // Получаем initData из заголовков или query параметров
    const initData = getHeader(event, 'x-telegram-init-data') || 
                     getQuery(event).initData as string

    console.log('[Telegram Auth] initData present:', !!initData)

    // В development режиме или если нет initData, используем тестового пользователя
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    console.log('[Telegram Auth] Environment:', process.env.NODE_ENV)
    console.log('[Telegram Auth] isDevelopment:', isDevelopment)
    
    if (!initData) {
      if (isDevelopment) {
        console.log('[Telegram Auth] Using test user in development mode')
        event.context.telegramUser = {
          id: 1,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ru'
        }
        return
      }

      console.error('[Telegram Auth] No initData in production mode')
      throw createError({
        statusCode: 401,
        statusMessage: 'Telegram authorization required'
      })
    }

    // Парсим initData
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    params.delete('hash')

    // Проверяем подпись только в production (временно отключено для отладки)
    const shouldVerifySignature = false // TODO: включить после отладки
    
    if (shouldVerifySignature && !isDevelopment) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN || ''
      
      if (!botToken) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Bot token not configured'
        })
      }
      
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
    
    console.log('[Telegram Auth] initData params:', Array.from(params.keys()))
    console.log('[Telegram Auth] userJson present:', !!userJson)
    
    if (!userJson) {
      console.error('[Telegram Auth] User data not found. Available params:', Array.from(params.entries()).map(([k]) => k))
      throw createError({
        statusCode: 400,
        statusMessage: 'User data not found in initData'
      })
    }

    const telegramUser = JSON.parse(userJson)
    
    console.log('[Telegram Auth] User authenticated:', {
      id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name
    })
    
    // Сохраняем пользователя в контексте запроса
    event.context.telegramUser = telegramUser
    
  } catch (error: any) {
    // В development режиме используем тестового пользователя при ошибке
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Telegram Auth] Error, falling back to test user:', error.message)
      event.context.telegramUser = {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'ru'
      }
      return
    }

    if (error.statusCode) {
      throw error
    }

    console.error('[Telegram Auth] Authentication failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed'
    })
  }
})
