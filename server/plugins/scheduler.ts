import { initializeScheduler } from '../utils/scheduler'

/**
 * Плагин Nitro для инициализации планировщика напоминаний
 * Запускается автоматически при старте сервера
 */
export default defineNitroPlugin((nitroApp) => {
  console.log('[Nitro Plugin] Инициализация планировщика напоминаний')
  
  // Инициализируем планировщик только в production или при явном указании
  const shouldInitialize = process.env.ENABLE_SCHEDULER === 'true' || process.env.NODE_ENV === 'production'
  
  if (shouldInitialize) {
    try {
      initializeScheduler()
      console.log('[Nitro Plugin] Планировщик успешно запущен')
    } catch (error) {
      console.error('[Nitro Plugin] Ошибка инициализации планировщика:', error)
    }
  } else {
    console.log('[Nitro Plugin] Планировщик отключен (установите ENABLE_SCHEDULER=true для включения)')
  }
})
