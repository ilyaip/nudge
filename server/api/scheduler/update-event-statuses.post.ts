import { runEventStatusUpdateManually } from '../../plugins/event-status-updater'

/**
 * API endpoint для ручного запуска обновления статусов событий
 * POST /api/scheduler/update-event-statuses
 * 
 * Используется для тестирования и отладки
 * Требования: 8.2, 8.3
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[API] Получен запрос на ручное обновление статусов событий')
    
    // Запускаем обновление статусов
    const result = await runEventStatusUpdateManually()
    
    return {
      success: true,
      message: 'Статусы событий успешно обновлены',
      updatedToInProgress: result.toInProgress,
      updatedToCompleted: result.toCompleted,
      totalUpdated: result.toInProgress + result.toCompleted
    }
  } catch (error) {
    console.error('[API] Ошибка при обновлении статусов событий:', error)
    
    return {
      success: false,
      error: 'Ошибка при обновлении статусов событий',
      details: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})
