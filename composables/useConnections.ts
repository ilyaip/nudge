import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCache } from '~/composables/useCache'

/**
 * Интерфейс связи "добавили меня"
 */
export interface AddedByConnection {
  contactId: number
  userId: number
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  isMutual: boolean
  addedAt: string
}

/**
 * Интерфейс взаимной связи
 */
export interface MutualConnection {
  contactId: number
  contactName: string
  userId: number
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  addedAt: string
}

/**
 * Composable для управления социальными связями
 * Получает списки "добавили меня" и взаимных связей
 */
export const useConnections = () => {
  const authStore = useAuthStore()
  const { get: getCache, set: setCache, invalidate } = useCache()

  // Состояние
  const addedByConnections = ref<AddedByConnection[]>([])
  const mutualConnections = ref<MutualConnection[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const addedByCount = computed(() => addedByConnections.value.length)
  const mutualCount = computed(() => mutualConnections.value.length)
  
  /**
   * Пользователи, которые добавили меня, но я их не добавил (не взаимные)
   */
  const pendingConnections = computed(() => 
    addedByConnections.value.filter(c => !c.isMutual)
  )
  
  const pendingCount = computed(() => pendingConnections.value.length)

  /**
   * Получить список пользователей, которые добавили текущего пользователя
   */
  const fetchAddedBy = async () => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Проверяем кэш
      const cacheKey = `connections-added-by-${userId}`
      const cached = getCache<AddedByConnection[]>(cacheKey)
      
      if (cached) {
        addedByConnections.value = cached
        isLoading.value = false
        return cached
      }

      const data = await $fetch<{ success: boolean; connections: AddedByConnection[] }>('/api/connections/added-by', {
        method: 'GET'
      })

      addedByConnections.value = data.connections || []
      
      // Сохраняем в кэш на 5 минут
      setCache(cacheKey, addedByConnections.value, 5 * 60 * 1000)
      
      return addedByConnections.value
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить связи'
      console.error('Ошибка загрузки added-by связей:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получить список взаимных связей
   */
  const fetchMutual = async () => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Проверяем кэш
      const cacheKey = `connections-mutual-${userId}`
      const cached = getCache<MutualConnection[]>(cacheKey)
      
      if (cached) {
        mutualConnections.value = cached
        isLoading.value = false
        return cached
      }

      const data = await $fetch<{ success: boolean; connections: MutualConnection[] }>('/api/connections/mutual', {
        method: 'GET'
      })

      mutualConnections.value = data.connections || []
      
      // Сохраняем в кэш на 5 минут
      setCache(cacheKey, mutualConnections.value, 5 * 60 * 1000)
      
      return mutualConnections.value
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить взаимные связи'
      console.error('Ошибка загрузки взаимных связей:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Загрузить все связи (added-by и mutual)
   */
  const fetchAll = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      await Promise.all([
        fetchAddedBy(),
        fetchMutual()
      ])
    } catch (err: any) {
      // Ошибки уже обработаны в отдельных методах
      console.error('Ошибка загрузки связей:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Инвалидировать кэш связей
   */
  const invalidateCache = () => {
    const userId = authStore.user?.id
    if (userId) {
      invalidate(`connections-added-by-${userId}`)
      invalidate(`connections-mutual-${userId}`)
    }
  }

  /**
   * Получить полное имя пользователя
   */
  const getDisplayName = (connection: AddedByConnection | MutualConnection): string => {
    if ('contactName' in connection && connection.contactName) {
      return connection.contactName
    }
    
    const parts = []
    if (connection.firstName) parts.push(connection.firstName)
    if (connection.lastName) parts.push(connection.lastName)
    
    if (parts.length > 0) {
      return parts.join(' ')
    }
    
    return connection.username || `User ${connection.telegramId}`
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // Состояние
    addedByConnections,
    mutualConnections,
    isLoading,
    error,
    // Вычисляемые свойства
    addedByCount,
    mutualCount,
    pendingConnections,
    pendingCount,
    // Методы
    fetchAddedBy,
    fetchMutual,
    fetchAll,
    invalidateCache,
    getDisplayName,
    clearError
  }
}
