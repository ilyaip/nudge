/**
 * Plugin для автоматического добавления Telegram initData в заголовки всех API запросов
 */
export default defineNuxtPlugin(() => {
  const initData = ref<string>('')

  // Получаем initData при инициализации
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    initData.value = window.Telegram.WebApp.initData
    console.log('[Telegram Init Data Plugin] Telegram WebApp available')
    console.log('[Telegram Init Data Plugin] initData received:', initData.value ? 'yes' : 'no')
    if (initData.value) {
      console.log('[Telegram Init Data Plugin] initData length:', initData.value.length)
    }
  } else {
    console.warn('[Telegram Init Data Plugin] Telegram WebApp not available')
  }

  // Добавляем глобальный interceptor для $fetch
  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      const url = typeof request === 'string' ? request : request.toString()
      
      console.log('[Telegram Init Data Plugin] Request to:', url)
      
      if (initData.value && url.startsWith('/api/')) {
        console.log('[Telegram Init Data Plugin] Adding initData to headers')
        const headers: any = options.headers || {}
        headers['x-telegram-init-data'] = initData.value
        options.headers = headers
      } else if (!initData.value && url.startsWith('/api/')) {
        console.warn('[Telegram Init Data Plugin] No initData for API request')
      }
    }
  })

  return {
    provide: {
      telegramInitData: initData
    }
  }
})
