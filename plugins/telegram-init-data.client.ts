/**
 * Plugin для автоматического добавления Telegram initData в заголовки всех API запросов
 */
export default defineNuxtPlugin(() => {
  const initData = ref<string>('')

  // Получаем initData при инициализации
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    initData.value = window.Telegram.WebApp.initData
    console.log('[Telegram Init Data] initData получен:', initData.value ? 'да' : 'нет')
  }

  // Добавляем глобальный interceptor для $fetch
  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      // Добавляем initData в заголовки для всех API запросов
      const url = typeof request === 'string' ? request : request.toString()
      
      if (initData.value && url.startsWith('/api/')) {
        // Используем any для обхода строгой типизации Headers
        (options.headers as any) = {
          ...(options.headers || {}),
          'x-telegram-init-data': initData.value
        }
      }
    }
  })

  return {
    provide: {
      telegramInitData: initData
    }
  }
})
