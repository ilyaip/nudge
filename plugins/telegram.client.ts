/**
 * Плагин для инициализации Telegram Web App
 * Загружает Telegram Web App SDK и настраивает глобальные перехватчики для API запросов
 */

export default defineNuxtPlugin(() => {
  // Проверяем, что мы в браузере
  if (process.server) return

  // Загружаем Telegram Web App SDK
  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-web-app.js'
  script.async = true
  document.head.appendChild(script)

  script.onload = () => {
    // Инициализируем Telegram Web App
    const tg = (window as any).Telegram?.WebApp
    
    if (tg) {
      // Готовим приложение
      tg.ready()
      
      // Расширяем приложение на весь экран
      tg.expand()
      
      // Настраиваем тему
      tg.setHeaderColor('#1f2937') // dark gray
      tg.setBackgroundColor('#f9fafb') // light gray
      
      console.log('Telegram Web App initialized:', {
        initData: tg.initData,
        initDataUnsafe: tg.initDataUnsafe,
        version: tg.version,
        platform: tg.platform,
        colorScheme: tg.colorScheme
      })
    } else {
      console.warn('Telegram Web App SDK not available')
    }
  }

  // Добавляем глобальный перехватчик для всех API запросов
  const originalFetch = window.fetch
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const tg = (window as any).Telegram?.WebApp
    
    // Добавляем initData в заголовки для API запросов
    if (tg && tg.initData && typeof input === 'string' && input.startsWith('/api/')) {
      init = init || {}
      init.headers = init.headers || {}
      
      if (init.headers instanceof Headers) {
        init.headers.set('x-telegram-init-data', tg.initData)
      } else if (Array.isArray(init.headers)) {
        init.headers.push(['x-telegram-init-data', tg.initData])
      } else {
        (init.headers as Record<string, string>)['x-telegram-init-data'] = tg.initData
      }
    }
    
    return originalFetch.call(this, input, init)
  }

  // Предоставляем доступ к Telegram Web App через provide
  return {
    provide: {
      telegram: () => (window as any).Telegram?.WebApp
    }
  }
})
