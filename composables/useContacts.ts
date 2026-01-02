import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCache } from '~/composables/useCache'

/**
 * Интерфейс контакта
 */
export interface Contact {
  id: number
  userId: number
  telegramContactId: string
  name: string
  username: string | null
  isTracked: boolean
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'custom'
  customFrequencyDays: number | null
  communicationType: 'message' | 'call' | 'meeting'
  category: 'family' | 'friends' | 'colleagues' | 'business'
  lastContactDate: string | null
  nextReminderDate: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Интерфейс для создания контакта
 */
export interface CreateContactData {
  telegramContactId: string
  name: string
  username?: string
  isTracked?: boolean
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'custom'
  customFrequencyDays?: number
  communicationType?: 'message' | 'call' | 'meeting'
  category?: 'family' | 'friends' | 'colleagues' | 'business'
  lastContactDate?: Date | null
}

/**
 * Интерфейс для обновления контакта
 */
export interface UpdateContactData {
  name?: string
  username?: string
  isTracked?: boolean
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'custom'
  customFrequencyDays?: number
  communicationType?: 'message' | 'call' | 'meeting'
  category?: 'family' | 'friends' | 'colleagues' | 'business'
  lastContactDate?: Date | null
  nextReminderDate?: Date | null
}

/**
 * Composable для управления контактами
 * Получает контакты из API, обрабатывает CRUD операции
 */
export const useContacts = () => {
  const authStore = useAuthStore()
  const { get: getCache, set: setCache, invalidate } = useCache()

  // Состояние
  const contacts = ref<Contact[]>([])
  const currentContact = ref<Contact | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const trackedContacts = computed(() => 
    contacts.value.filter(c => c.isTracked)
  )

  const untrackedContacts = computed(() => 
    contacts.value.filter(c => !c.isTracked)
  )

  const contactsByCategory = computed(() => {
    const grouped: Record<string, Contact[]> = {
      family: [],
      friends: [],
      colleagues: [],
      business: []
    }
    
    contacts.value.forEach(contact => {
      if (grouped[contact.category]) {
        grouped[contact.category].push(contact)
      }
    })
    
    return grouped
  })

  const contactCount = computed(() => ({
    total: contacts.value.length,
    tracked: trackedContacts.value.length,
    untracked: untrackedContacts.value.length
  }))

  /**
   * Получить все контакты пользователя из API
   */
  const fetchContacts = async () => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Проверяем кэш
      const cacheKey = `contacts-${userId}`
      const cached = getCache<Contact[]>(cacheKey)
      
      if (cached) {
        contacts.value = cached
        isLoading.value = false
        return
      }

      const data = await $fetch<{ contacts: Contact[] }>('/api/contacts', {
        method: 'GET',
        query: { userId }
      })

      contacts.value = data.contacts || []
      
      // Сохраняем в кэш на 5 минут
      setCache(cacheKey, contacts.value, 5 * 60 * 1000)
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить контакты'
      console.error('Ошибка загрузки контактов:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получить детали контакта по ID
   * @param contactId - ID контакта
   */
  const fetchContact = async (contactId: number) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{ contact: Contact }>(`/api/contacts/${contactId}`, {
        method: 'GET',
        query: { userId }
      })

      currentContact.value = data.contact
      return data.contact
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить контакт'
      console.error('Ошибка загрузки контакта:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Создать новый контакт
   * @param contactData - Данные нового контакта
   */
  const createContact = async (contactData: CreateContactData) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{ contact: Contact }>('/api/contacts', {
        method: 'POST',
        body: {
          userId,
          ...contactData
        }
      })

      // Добавить новый контакт в локальное состояние
      contacts.value.push(data.contact)
      
      // Инвалидируем кэш контактов
      invalidate(`contacts-${userId}`)
      
      return data.contact
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось создать контакт'
      console.error('Ошибка создания контакта:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обновить настройки контакта
   * @param contactId - ID контакта
   * @param updateData - Данные для обновления
   */
  const updateContact = async (contactId: number, updateData: UpdateContactData) => {
    // Оптимистичное обновление: сразу обновляем UI
    const index = contacts.value.findIndex(c => c.id === contactId)
    let previousContact: Contact | null = null
    let previousCurrentContact: Contact | null = null
    
    if (index !== -1) {
      // Сохраняем предыдущее состояние для отката
      previousContact = { ...contacts.value[index] }
      
      // Оптимистично обновляем состояние
      contacts.value[index] = {
        ...contacts.value[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    }
    
    if (currentContact.value?.id === contactId) {
      previousCurrentContact = { ...currentContact.value }
      currentContact.value = {
        ...currentContact.value,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    }

    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{ contact: Contact }>(`/api/contacts/${contactId}`, {
        method: 'PUT',
        body: {
          userId,
          ...updateData
        }
      })

      // Обновляем с реальными данными с сервера
      if (index !== -1) {
        contacts.value[index] = data.contact
      }

      if (currentContact.value?.id === contactId) {
        currentContact.value = data.contact
      }
      
      // Инвалидируем кэш контактов
      const userId = authStore.user?.id
      if (userId) {
        invalidate(`contacts-${userId}`)
      }

      return data.contact
    } catch (err: any) {
      // Откатываем оптимистичное обновление в случае ошибки
      if (previousContact && index !== -1) {
        contacts.value[index] = previousContact
      }
      if (previousCurrentContact && currentContact.value?.id === contactId) {
        currentContact.value = previousCurrentContact
      }
      
      error.value = err.data?.statusMessage || err.message || 'Не удалось обновить контакт'
      console.error('Ошибка обновления контакта:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Удалить контакт
   * @param contactId - ID контакта
   */
  const deleteContact = async (contactId: number) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      await $fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        query: { userId }
      })

      // Удалить контакт из локального состояния
      contacts.value = contacts.value.filter(c => c.id !== contactId)

      // Очистить текущий контакт, если это он
      if (currentContact.value?.id === contactId) {
        currentContact.value = null
      }
      
      // Инвалидируем кэш контактов
      invalidate(`contacts-${userId}`)
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось удалить контакт'
      console.error('Ошибка удаления контакта:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Найти контакт по ID в локальном состоянии
   * @param contactId - ID контакта
   */
  const findContactById = (contactId: number): Contact | undefined => {
    return contacts.value.find(c => c.id === contactId)
  }

  /**
   * Фильтровать контакты по поисковому запросу
   * @param searchQuery - Поисковый запрос
   */
  const filterContacts = (searchQuery: string): Contact[] => {
    if (!searchQuery.trim()) {
      return contacts.value
    }

    const query = searchQuery.toLowerCase()
    return contacts.value.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      (contact.username && contact.username.toLowerCase().includes(query))
    )
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Очистить текущий контакт
   */
  const clearCurrentContact = () => {
    currentContact.value = null
  }

  return {
    // Состояние
    contacts,
    currentContact,
    isLoading,
    error,
    // Вычисляемые свойства
    trackedContacts,
    untrackedContacts,
    contactsByCategory,
    contactCount,
    // Методы
    fetchContacts,
    fetchContact,
    createContact,
    updateContact,
    deleteContact,
    findContactById,
    filterContacts,
    clearError,
    clearCurrentContact
  }
}
