import { defineNuxtPlugin } from '#app'
import type { PiniaPluginContext } from 'pinia'

/**
 * Plugin для сохранения состояния Pinia в localStorage
 * Автоматически сохраняет и восстанавливает состояние при перезагрузке страницы
 */
export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as any

  if (!pinia) return

  // Подписываемся на изменения в stores
  pinia.use(({ store }: PiniaPluginContext) => {
    // Список stores, которые нужно сохранять
    const storesToPersist = ['auth']
    
    if (!storesToPersist.includes(store.$id)) {
      return
    }

    // Ключ для localStorage
    const storageKey = `nudge-app-${store.$id}`

    // Восстанавливаем состояние из localStorage при инициализации
    const savedState = localStorage.getItem(storageKey)
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        store.$patch(parsedState)
      } catch (error) {
        console.error(`Ошибка восстановления состояния для ${store.$id}:`, error)
        // Очищаем поврежденные данные
        localStorage.removeItem(storageKey)
      }
    }

    // Сохраняем состояние при каждом изменении
    store.$subscribe((_mutation: any, state: any) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.error(`Ошибка сохранения состояния для ${store.$id}:`, error)
      }
    })
  })
})
