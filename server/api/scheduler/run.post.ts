import { runSchedulerManually } from '../../utils/scheduler'

/**
 * API endpoint для ручного запуска планировщика напоминаний
 * POST /api/scheduler/run
 * 
 * Используется для тестирования и отладки
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[API] Получен запрос на ручной запуск планировщика')
    
    // Запускаем задачу планировщика
    const result = await runSchedulerManually()
    
    return {
      success: true,
      message: 'Планировщик успешно выполнен',
      notificationRequestsCount: result.notificationRequests.length,
      notificationRequests: result.notificationRequests.map((req: any) => ({
        userId: req.userId,
        telegramId: req.telegramId,
        contactsCount: req.contacts.length,
        contacts: req.contacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          frequency: c.frequency
        }))
      }))
    }
  } catch (error) {
    console.error('[API] Ошибка при запуске планировщика:', error)
    
    return {
      success: false,
      error: 'Ошибка при выполнении планировщика',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})
