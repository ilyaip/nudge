import type { NotificationRequest } from './scheduler'
import { db } from '../db'
import { reminders } from '../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Интерфейс для результата отправки уведомления
 */
export interface NotificationResult {
  success: boolean
  telegramId: string
  error?: string
  retryCount?: number
}

/**
 * Класс для работы с Telegram Bot API
 */
export class TelegramBot {
  private botToken: string
  private apiUrl: string
  private maxRetries: number = 3
  private retryDelay: number = 1000 // 1 секунда
  
  constructor(botToken: string) {
    if (!botToken) {
      throw new Error('Telegram Bot Token не указан')
    }
    
    this.botToken = botToken
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`
  }
  
  /**
   * Отправить сообщение пользователю
   * @param chatId - ID чата (Telegram ID пользователя)
   * @param text - Текст сообщения
   * @param parseMode - Режим парсинга (HTML, Markdown)
   * @returns Результат отправки
   */
  async sendMessage(
    chatId: string,
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML'
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: parseMode
        })
      })
      
      const data = await response.json()
      
      if (!data.ok) {
        console.error(`[Telegram Bot] Ошибка отправки сообщения: ${data.description}`)
        return false
      }
      
      return true
    } catch (error) {
      console.error('[Telegram Bot] Ошибка при отправке сообщения:', error)
      return false
    }
  }
  
  /**
   * Отправить сообщение с повторными попытками
   * @param chatId - ID чата
   * @param text - Текст сообщения
   * @returns Результат отправки с количеством попыток
   */
  async sendMessageWithRetry(
    chatId: string,
    text: string
  ): Promise<{ success: boolean; retryCount: number }> {
    let retryCount = 0
    
    while (retryCount < this.maxRetries) {
      const success = await this.sendMessage(chatId, text)
      
      if (success) {
        return { success: true, retryCount }
      }
      
      retryCount++
      
      if (retryCount < this.maxRetries) {
        // Экспоненциальная задержка перед повторной попыткой
        const delay = this.retryDelay * Math.pow(2, retryCount - 1)
        console.log(
          `[Telegram Bot] Повторная попытка ${retryCount}/${this.maxRetries} через ${delay}мс`
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return { success: false, retryCount }
  }
  
  /**
   * Форматировать сообщение с напоминаниями
   * @param request - Запрос на уведомление
   * @returns Отформатированный текст сообщения
   */
  formatReminderMessage(request: NotificationRequest): string {
    const { contacts } = request
    
    let message = '<b>🔔 Напоминание о контактах</b>\n\n'
    message += `Сегодня стоит связаться с ${contacts.length} ${this.getContactsWord(contacts.length)}:\n\n`
    
    contacts.forEach((contact, index) => {
      const emoji = this.getCategoryEmoji(contact.category)
      message += `${index + 1}. ${emoji} <b>${contact.name}</b>`
      
      if (contact.username) {
        message += ` (@${contact.username})`
      }
      
      message += `\n   📅 Частота: ${this.getFrequencyText(contact.frequency)}`
      message += `\n   💬 Тип: ${this.getCommunicationTypeText(contact.communicationType)}\n\n`
    })
    
    message += '✅ Отметьте выполненные напоминания в приложении!'
    
    return message
  }
  
  /**
   * Получить правильное склонение слова "контакт"
   */
  private getContactsWord(count: number): string {
    if (count === 1) return 'контактом'
    if (count >= 2 && count <= 4) return 'контактами'
    return 'контактами'
  }
  
  /**
   * Получить эмодзи для категории
   */
  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      family: '👨‍👩‍👧‍👦',
      friends: '👥',
      colleagues: '💼',
      business: '🤝'
    }
    return emojiMap[category] || '👤'
  }
  
  /**
   * Получить текстовое описание частоты
   */
  private getFrequencyText(frequency: string): string {
    const frequencyMap: Record<string, string> = {
      weekly: 'Еженедельно',
      monthly: 'Ежемесячно',
      quarterly: 'Ежеквартально',
      custom: 'Пользовательская'
    }
    return frequencyMap[frequency] || frequency
  }
  
  /**
   * Получить текстовое описание типа коммуникации
   */
  private getCommunicationTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      message: 'Сообщение',
      call: 'Звонок',
      meeting: 'Встреча'
    }
    return typeMap[type] || type
  }
}

/**
 * Получить экземпляр бота
 */
export function getTelegramBot(): TelegramBot {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не установлен в переменных окружения')
  }
  
  return new TelegramBot(botToken)
}

/**
 * Отправить уведомления для списка запросов
 * @param notificationRequests - Массив запросов на уведомления
 * @returns Массив результатов отправки
 */
export async function sendNotifications(
  notificationRequests: NotificationRequest[]
): Promise<NotificationResult[]> {
  console.log(`[Telegram Bot] Начало отправки ${notificationRequests.length} уведомлений`)
  
  const bot = getTelegramBot()
  const results: NotificationResult[] = []
  
  for (const request of notificationRequests) {
    try {
      // Форматируем сообщение
      const message = bot.formatReminderMessage(request)
      
      // Отправляем с повторными попытками
      const { success, retryCount } = await bot.sendMessageWithRetry(
        request.telegramId,
        message
      )
      
      if (success) {
        console.log(
          `[Telegram Bot] Уведомление отправлено пользователю ${request.telegramId} ` +
          `(попыток: ${retryCount + 1})`
        )
        
        // Обновляем статус уведомлений в БД
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        for (const contact of request.contacts) {
          await db
            .update(reminders)
            .set({ notificationSent: true })
            .where(
              and(
                eq(reminders.userId, request.userId),
                eq(reminders.contactId, contact.id),
                eq(reminders.dueDate, today),
                eq(reminders.completed, false)
              )
            )
        }
        
        // Логируем событие
        console.log(
          `[Telegram Bot] Обновлен статус напоминаний для пользователя ${request.userId}`
        )
        
        results.push({
          success: true,
          telegramId: request.telegramId,
          retryCount
        })
      } else {
        console.error(
          `[Telegram Bot] Не удалось отправить уведомление пользователю ${request.telegramId} ` +
          `после ${retryCount} попыток`
        )
        
        results.push({
          success: false,
          telegramId: request.telegramId,
          error: 'Превышено количество попыток отправки',
          retryCount
        })
      }
    } catch (error) {
      console.error(
        `[Telegram Bot] Ошибка при отправке уведомления пользователю ${request.telegramId}:`,
        error
      )
      
      results.push({
        success: false,
        telegramId: request.telegramId,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      })
    }
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(
    `[Telegram Bot] Отправка завершена. Успешно: ${successCount}/${results.length}`
  )
  
  return results
}
