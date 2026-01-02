import { ref } from 'vue'

/**
 * Интерфейс уведомления
 */
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'xp'
  title?: string
  message: string
  duration?: number
  dismissible?: boolean
}

/**
 * Список активных уведомлений
 */
const notifications = ref<Notification[]>([])

/**
 * Счетчик для генерации уникальных ID
 */
let notificationIdCounter = 0

/**
 * Composable для управления уведомлениями
 * Показывает toast-уведомления пользователю
 */
export const useNotifications = () => {
  /**
   * Добавить уведомление
   * @param notification - Данные уведомления
   */
  const addNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${++notificationIdCounter}`
    const duration = notification.duration ?? 3000 // По умолчанию 3 секунды
    
    const newNotification: Notification = {
      id,
      ...notification,
      duration,
      dismissible: notification.dismissible ?? true
    }
    
    notifications.value.push(newNotification)
    
    // Автоматически удалить уведомление через заданное время
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  /**
   * Удалить уведомление
   * @param id - ID уведомления
   */
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Показать уведомление об успехе
   * @param message - Сообщение
   * @param title - Заголовок (опционально)
   * @param duration - Длительность в мс (опционально)
   */
  const showSuccess = (message: string, title?: string, duration?: number): string => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration
    })
  }

  /**
   * Показать уведомление об ошибке
   * @param message - Сообщение
   * @param title - Заголовок (опционально)
   * @param duration - Длительность в мс (опционально, 0 = не закрывать автоматически)
   */
  const showError = (message: string, title?: string, duration?: number): string => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: duration ?? 0 // Ошибки не закрываются автоматически по умолчанию
    })
  }

  /**
   * Показать предупреждение
   * @param message - Сообщение
   * @param title - Заголовок (опционально)
   * @param duration - Длительность в мс (опционально)
   */
  const showWarning = (message: string, title?: string, duration?: number): string => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration
    })
  }

  /**
   * Показать информационное уведомление
   * @param message - Сообщение
   * @param title - Заголовок (опционально)
   * @param duration - Длительность в мс (опционально)
   */
  const showInfo = (message: string, title?: string, duration?: number): string => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration
    })
  }

  /**
   * Показать уведомление о заработанном XP
   * @param message - Сообщение (например, "+20 XP заработано!")
   * @param title - Заголовок (опционально)
   * @param duration - Длительность в мс (опционально)
   */
  const showXP = (message: string, title?: string, duration?: number): string => {
    return addNotification({
      type: 'xp',
      title,
      message,
      duration
    })
  }

  /**
   * Очистить все уведомления
   */
  const clearAll = () => {
    notifications.value = []
  }

  return {
    // Состояние
    notifications,
    // Методы
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showXP,
    clearAll
  }
}
