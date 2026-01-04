import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCache } from '~/composables/useCache'

/**
 * Типы событий
 */
export type EventType = 'meeting' | 'call' | 'trip' | 'other'
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type RecurrencePattern = 'daily' | 'weekly' | 'monthly' | 'custom'
export type ParticipantStatus = 'pending' | 'accepted' | 'declined'

/**
 * Интерфейс участника события
 */
export interface EventParticipant {
  id: number
  eventId: number
  contactId: number
  status: ParticipantStatus
  respondedAt: string | null
  createdAt: string
  contact: {
    id: number
    name: string
    username: string | null
    linkedUserId: number | null
    isMutual: boolean
  } | null
}

/**
 * Интерфейс события
 */
export interface Event {
  id: number
  organizerId: number
  title: string
  type: EventType
  customType: string | null
  description: string | null
  startDate: string
  endDate: string
  duration: number
  status: EventStatus
  isRecurring: boolean
  recurrencePattern: RecurrencePattern | null
  recurrenceInterval: number | null
  parentEventId: number | null
  reminderMinutes: number
  createdAt: string
  updatedAt: string
  participants?: EventParticipant[]
  participantCount?: number
  isOrganizer?: boolean
  organizer?: {
    id: number
    telegramId: string
    username: string | null
    firstName: string | null
    lastName: string | null
  }
}

/**
 * Интерфейс для создания события
 */
export interface CreateEventData {
  title: string
  type: EventType
  customType?: string
  description?: string
  startDate: string
  duration: number
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  recurrenceInterval?: number
  recurrenceCount?: number
  reminderMinutes?: number
  participantContactIds?: number[]
}

/**
 * Интерфейс для обновления события
 */
export interface UpdateEventData {
  title?: string
  type?: EventType
  customType?: string
  description?: string
  startDate?: string
  duration?: number
  reminderMinutes?: number
  participantContactIds?: number[]
}

/**
 * Параметры фильтрации событий
 */
export interface EventFilters {
  status?: EventStatus
  startFrom?: string
  startTo?: string
  upcoming?: boolean
}

/**
 * Composable для управления событиями
 * CRUD операции и запрос предстоящих событий
 * Requirements: 4.1, 9.5
 */
export const useEvents = () => {
  const authStore = useAuthStore()
  const { get: getCache, set: setCache, invalidate } = useCache()

  // Состояние
  const events = ref<Event[]>([])
  const upcomingEvents = ref<Event[]>([])
  const currentEvent = ref<Event | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const scheduledEvents = computed(() =>
    events.value.filter(e => e.status === 'scheduled')
  )

  const inProgressEvents = computed(() =>
    events.value.filter(e => e.status === 'in_progress')
  )

  const completedEvents = computed(() =>
    events.value.filter(e => e.status === 'completed')
  )

  const cancelledEvents = computed(() =>
    events.value.filter(e => e.status === 'cancelled')
  )

  const eventCount = computed(() => ({
    total: events.value.length,
    scheduled: scheduledEvents.value.length,
    inProgress: inProgressEvents.value.length,
    completed: completedEvents.value.length,
    cancelled: cancelledEvents.value.length
  }))

  /**
   * Получить все события пользователя
   * @param filters - Параметры фильтрации
   */
  const fetchEvents = async (filters?: EventFilters) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Формируем query параметры
      const queryParams = new URLSearchParams()
      if (filters?.status) queryParams.set('status', filters.status)
      if (filters?.startFrom) queryParams.set('startFrom', filters.startFrom)
      if (filters?.startTo) queryParams.set('startTo', filters.startTo)
      if (filters?.upcoming) queryParams.set('upcoming', 'true')

      const queryString = queryParams.toString()
      const url = `/api/events${queryString ? `?${queryString}` : ''}`

      const data = await $fetch<{ success: boolean; events: Event[] }>(url, {
        method: 'GET'
      })

      events.value = data.events || []
      return events.value
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить события'
      console.error('Ошибка загрузки событий:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получить предстоящие события (на ближайшие 7 дней)
   * Requirement 9.5
   */
  const fetchUpcomingEvents = async () => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Проверяем кэш
      const cacheKey = `upcoming-events-${userId}`
      const cached = getCache<Event[]>(cacheKey)

      if (cached) {
        upcomingEvents.value = cached
        isLoading.value = false
        return cached
      }

      const data = await $fetch<{ success: boolean; events: Event[] }>('/api/events?upcoming=true', {
        method: 'GET'
      })

      upcomingEvents.value = data.events || []

      // Сохраняем в кэш на 2 минуты
      setCache(cacheKey, upcomingEvents.value, 2 * 60 * 1000)

      return upcomingEvents.value
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить предстоящие события'
      console.error('Ошибка загрузки предстоящих событий:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Получить детали события по ID
   * @param eventId - ID события
   */
  const fetchEvent = async (eventId: number) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<{ success: boolean; event: Event }>(`/api/events/${eventId}`, {
        method: 'GET'
      })

      currentEvent.value = data.event
      return data.event
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить событие'
      console.error('Ошибка загрузки события:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Создать новое событие
   * @param eventData - Данные нового события
   */
  const createEvent = async (eventData: CreateEventData) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{
        success: boolean
        event: Event
        childEvents?: Event[]
        participants: EventParticipant[]
        invitations: any[]
      }>('/api/events', {
        method: 'POST',
        body: eventData
      })

      // Добавляем новое событие в локальное состояние
      const newEvent = {
        ...data.event,
        participants: data.participants,
        participantCount: data.participants.length
      }
      events.value.unshift(newEvent)

      // Инвалидируем кэш
      invalidate(`upcoming-events-${userId}`)

      return newEvent
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось создать событие'
      console.error('Ошибка создания события:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обновить событие
   * @param eventId - ID события
   * @param updateData - Данные для обновления
   */
  const updateEvent = async (eventId: number, updateData: UpdateEventData) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{ success: boolean; event: Event }>(`/api/events/${eventId}`, {
        method: 'PUT',
        body: updateData
      })

      // Обновляем в локальном состоянии
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = data.event
      }

      if (currentEvent.value?.id === eventId) {
        currentEvent.value = data.event
      }

      // Инвалидируем кэш
      invalidate(`upcoming-events-${userId}`)

      return data.event
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось обновить событие'
      console.error('Ошибка обновления события:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Удалить событие
   * @param eventId - ID события
   */
  const deleteEvent = async (eventId: number) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      await $fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      })

      // Удаляем из локального состояния
      events.value = events.value.filter(e => e.id !== eventId)
      upcomingEvents.value = upcomingEvents.value.filter(e => e.id !== eventId)

      if (currentEvent.value?.id === eventId) {
        currentEvent.value = null
      }

      // Инвалидируем кэш
      invalidate(`upcoming-events-${userId}`)
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось удалить событие'
      console.error('Ошибка удаления события:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Отменить событие
   * @param eventId - ID события
   */
  const cancelEvent = async (eventId: number) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{ success: boolean; event: Event }>(`/api/events/${eventId}/cancel`, {
        method: 'POST'
      })

      // Обновляем в локальном состоянии
      const index = events.value.findIndex(e => e.id === eventId)
      if (index !== -1) {
        events.value[index] = data.event
      }

      // Удаляем из предстоящих
      upcomingEvents.value = upcomingEvents.value.filter(e => e.id !== eventId)

      if (currentEvent.value?.id === eventId) {
        currentEvent.value = data.event
      }

      // Инвалидируем кэш
      invalidate(`upcoming-events-${userId}`)

      return data.event
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось отменить событие'
      console.error('Ошибка отмены события:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Очистить текущее событие
   */
  const clearCurrentEvent = () => {
    currentEvent.value = null
  }

  /**
   * Получить иконку типа события
   */
  const getEventTypeIcon = (type: EventType): string => {
    const icons: Record<EventType, string> = {
      meeting: '🤝',
      call: '📞',
      trip: '✈️',
      other: '📅'
    }
    return icons[type] || '📅'
  }

  /**
   * Получить название типа события на русском
   */
  const getEventTypeLabel = (type: EventType, customType?: string | null): string => {
    if (type === 'other' && customType) {
      return customType
    }
    const labels: Record<EventType, string> = {
      meeting: 'Встреча',
      call: 'Звонок',
      trip: 'Поездка',
      other: 'Другое'
    }
    return labels[type] || type
  }

  /**
   * Получить название статуса на русском
   */
  const getEventStatusLabel = (status: EventStatus): string => {
    const labels: Record<EventStatus, string> = {
      scheduled: 'Запланировано',
      in_progress: 'В процессе',
      completed: 'Завершено',
      cancelled: 'Отменено'
    }
    return labels[status] || status
  }

  /**
   * Получить цвет статуса
   */
  const getEventStatusColor = (status: EventStatus): string => {
    const colors: Record<EventStatus, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return {
    // Состояние
    events,
    upcomingEvents,
    currentEvent,
    isLoading,
    error,
    // Вычисляемые свойства
    scheduledEvents,
    inProgressEvents,
    completedEvents,
    cancelledEvents,
    eventCount,
    // Методы
    fetchEvents,
    fetchUpcomingEvents,
    fetchEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    cancelEvent,
    clearError,
    clearCurrentEvent,
    // Утилиты
    getEventTypeIcon,
    getEventTypeLabel,
    getEventStatusLabel,
    getEventStatusColor
  }
}
