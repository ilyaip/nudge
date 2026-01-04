import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCache } from '~/composables/useCache'

/**
 * Статус приглашения
 */
export type InvitationStatus = 'pending' | 'accepted' | 'declined'

/**
 * Интерфейс события в приглашении
 */
export interface InvitationEvent {
  id: number
  title: string
  type: 'meeting' | 'call' | 'trip' | 'other'
  customType: string | null
  description: string | null
  startDate: string
  endDate: string
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

/**
 * Интерфейс пригласившего пользователя
 */
export interface InvitationInviter {
  id: number
  firstName: string | null
  lastName: string | null
  username: string | null
}

/**
 * Интерфейс приглашения
 */
export interface Invitation {
  id: number
  status: InvitationStatus
  respondedAt: string | null
  createdAt: string
  event: InvitationEvent | null
  inviter: InvitationInviter | null
}

/**
 * Composable для управления приглашениями
 * Получение и ответ на приглашения
 * Requirements: 7.1, 7.3
 */
export const useInvitations = () => {
  const authStore = useAuthStore()
  const { get: getCache, set: setCache, invalidate } = useCache()

  // Состояние
  const invitations = ref<Invitation[]>([])
  const isLoading = ref(false)
  const isResponding = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const pendingInvitations = computed(() =>
    invitations.value.filter(i => i.status === 'pending')
  )

  const acceptedInvitations = computed(() =>
    invitations.value.filter(i => i.status === 'accepted')
  )

  const declinedInvitations = computed(() =>
    invitations.value.filter(i => i.status === 'declined')
  )

  const pendingCount = computed(() => pendingInvitations.value.length)

  const invitationCount = computed(() => ({
    total: invitations.value.length,
    pending: pendingInvitations.value.length,
    accepted: acceptedInvitations.value.length,
    declined: declinedInvitations.value.length
  }))

  /**
   * Получить список приглашений
   * @param pendingOnly - Только ожидающие приглашения (по умолчанию true)
   * Requirement 7.1
   */
  const fetchInvitations = async (pendingOnly: boolean = true) => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Проверяем кэш
      const cacheKey = `invitations-${userId}-${pendingOnly ? 'pending' : 'all'}`
      const cached = getCache<Invitation[]>(cacheKey)

      if (cached) {
        invitations.value = cached
        isLoading.value = false
        return cached
      }

      const queryParams = new URLSearchParams()
      if (pendingOnly) {
        queryParams.set('pending', 'true')
      }

      const url = `/api/invitations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

      const data = await $fetch<{ success: boolean; invitations: Invitation[] }>(url, {
        method: 'GET'
      })

      invitations.value = data.invitations || []

      // Сохраняем в кэш на 2 минуты
      setCache(cacheKey, invitations.value, 2 * 60 * 1000)

      return invitations.value
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить приглашения'
      console.error('Ошибка загрузки приглашений:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Ответить на приглашение
   * @param invitationId - ID приглашения
   * @param status - Статус ответа (accepted или declined)
   * Requirement 7.3
   */
  const respondToInvitation = async (invitationId: number, status: 'accepted' | 'declined') => {
    try {
      isResponding.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      const data = await $fetch<{
        success: boolean
        invitation: Invitation
        participant: any
        notificationSent: boolean
      }>(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: { status }
      })

      // Обновляем локальное состояние
      const index = invitations.value.findIndex(i => i.id === invitationId)
      if (index !== -1) {
        invitations.value[index] = {
          ...invitations.value[index],
          status: data.invitation.status,
          respondedAt: data.invitation.respondedAt
        }
      }

      // Инвалидируем кэш
      invalidate(`invitations-${userId}-pending`)
      invalidate(`invitations-${userId}-all`)

      return data
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось ответить на приглашение'
      console.error('Ошибка ответа на приглашение:', err)
      throw err
    } finally {
      isResponding.value = false
    }
  }

  /**
   * Принять приглашение
   * @param invitationId - ID приглашения
   */
  const acceptInvitation = async (invitationId: number) => {
    return respondToInvitation(invitationId, 'accepted')
  }

  /**
   * Отклонить приглашение
   * @param invitationId - ID приглашения
   */
  const declineInvitation = async (invitationId: number) => {
    return respondToInvitation(invitationId, 'declined')
  }

  /**
   * Инвалидировать кэш приглашений
   */
  const invalidateCache = () => {
    const userId = authStore.user?.id
    if (userId) {
      invalidate(`invitations-${userId}-pending`)
      invalidate(`invitations-${userId}-all`)
    }
  }

  /**
   * Получить полное имя пригласившего
   */
  const getInviterName = (inviter: InvitationInviter | null): string => {
    if (!inviter) return 'Неизвестный пользователь'

    const parts = []
    if (inviter.firstName) parts.push(inviter.firstName)
    if (inviter.lastName) parts.push(inviter.lastName)

    if (parts.length > 0) {
      return parts.join(' ')
    }

    return inviter.username ? `@${inviter.username}` : 'Пользователь'
  }

  /**
   * Получить иконку типа события
   */
  const getEventTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
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
  const getEventTypeLabel = (type: string, customType?: string | null): string => {
    if (type === 'other' && customType) {
      return customType
    }
    const labels: Record<string, string> = {
      meeting: 'Встреча',
      call: 'Звонок',
      trip: 'Поездка',
      other: 'Другое'
    }
    return labels[type] || type
  }

  /**
   * Форматировать дату события
   */
  const formatEventDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Сегодня
    if (date.toDateString() === now.toDateString()) {
      return 'Сегодня'
    }

    // Завтра
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра'
    }

    // В течение недели - показываем день недели
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 0 && diffDays <= 7) {
      return date.toLocaleDateString('ru-RU', { weekday: 'long' })
    }

    // Иначе полная дата
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    })
  }

  /**
   * Форматировать время события
   */
  const formatEventTime = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // Состояние
    invitations,
    isLoading,
    isResponding,
    error,
    // Вычисляемые свойства
    pendingInvitations,
    acceptedInvitations,
    declinedInvitations,
    pendingCount,
    invitationCount,
    // Методы
    fetchInvitations,
    respondToInvitation,
    acceptInvitation,
    declineInvitation,
    invalidateCache,
    clearError,
    // Утилиты
    getInviterName,
    getEventTypeIcon,
    getEventTypeLabel,
    formatEventDate,
    formatEventTime
  }
}
