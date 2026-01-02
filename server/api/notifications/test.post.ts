import { getTelegramBot } from '../../utils/telegram-bot'

/**
 * API endpoint для тестирования отправки уведомлений
 * POST /api/notifications/test
 * 
 * Body: { telegramId: string, message?: string }
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    if (!body.telegramId) {
      return {
        success: false,
        error: 'telegramId обязателен'
      }
    }
    
    const bot = getTelegramBot()
    const message = body.message || '<b>🔔 Тестовое уведомление</b>\n\nЭто тестовое сообщение от Nudge Bot!'
    
    console.log(`[API] Отправка тестового уведомления пользователю ${body.telegramId}`)
    
    const { success, retryCount } = await bot.sendMessageWithRetry(
      body.telegramId,
      message
    )
    
    if (success) {
      return {
        success: true,
        message: 'Уведомление успешно отправлено',
        retryCount
      }
    } else {
      return {
        success: false,
        error: 'Не удалось отправить уведомление',
        retryCount
      }
    }
  } catch (error) {
    console.error('[API] Ошибка при отправке тестового уведомления:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})
