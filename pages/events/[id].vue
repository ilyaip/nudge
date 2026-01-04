<template>
  <div class="min-h-screen bg-background pb-8 overflow-x-hidden">
    <div class="p-4 max-w-full overflow-hidden">
      <!-- Заголовок -->
      <header class="mb-6">
        <div class="flex items-center justify-between gap-2 min-w-0">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <button
              @click="handleBack"
              class="w-10 h-10 rounded-xl bg-backgroundSecondary flex items-center justify-center hover:bg-gray-100 transition-all flex-shrink-0"
            >
              <svg class="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-xl font-bold text-text truncate">Событие</h1>
          </div>
          
          <!-- Кнопки действий для организатора -->
          <div v-if="event?.isOrganizer && event.status !== 'cancelled'" class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="showEditMode = true"
              class="w-10 h-10 rounded-xl bg-backgroundSecondary flex items-center justify-center hover:bg-gray-100 transition-all"
              title="Редактировать"
            >
              <svg class="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="showCancelConfirm = true"
              class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center hover:bg-red-100 transition-all"
              title="Отменить"
            >
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Состояние загрузки -->
      <SkeletonLoader 
        v-if="isLoading" 
        type="card" 
        :count="3" 
      />

      <!-- Ошибка -->
      <ErrorMessage
        v-else-if="error"
        :message="error"
        title="Ошибка загрузки события"
        type="error"
        retryable
        :on-retry="loadEvent"
      />

      <!-- Контент события -->
      <div v-else-if="event" class="space-y-4">
        <!-- Основная информация -->
        <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-5">
          <!-- Статус -->
          <div class="flex items-center justify-between mb-4">
            <span 
              class="px-3 py-1 rounded-full text-sm font-semibold"
              :class="statusClass"
            >
              {{ statusLabel }}
            </span>
            <span v-if="event.isRecurring" class="text-xs text-textSecondary flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ recurrenceLabel }}
            </span>
          </div>

          <!-- Иконка и название -->
          <div class="flex items-start gap-4 mb-4">
            <div 
              class="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              :class="iconBackgroundClass"
            >
              <span class="text-2xl">{{ typeIcon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-bold text-text mb-1 break-words">{{ event.title }}</h2>
              <p class="text-textSecondary text-sm">{{ typeLabel }}</p>
            </div>
          </div>

          <!-- Дата и время -->
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-3">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-text">{{ formattedDate }}</p>
              <p class="text-sm text-textSecondary">{{ formattedTime }} • {{ durationLabel }}</p>
            </div>
          </div>

          <!-- Напоминание -->
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p class="font-semibold text-text">Напоминание</p>
              <p class="text-sm text-textSecondary">{{ reminderLabel }}</p>
            </div>
          </div>
        </section>

        <!-- Описание -->
        <section v-if="event.description" class="bg-backgroundSecondary rounded-3xl shadow-sm p-5">
          <h3 class="font-bold text-text mb-2">Описание</h3>
          <p class="text-textSecondary whitespace-pre-wrap">{{ event.description }}</p>
        </section>

        <!-- Организатор -->
        <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-5">
          <h3 class="font-bold text-text mb-3">Организатор</h3>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primaryLight flex items-center justify-center text-white font-bold text-lg">
              {{ organizerInitial }}
            </div>
            <div>
              <p class="font-semibold text-text">{{ organizerName }}</p>
              <p v-if="event.organizer?.username" class="text-sm text-textSecondary">
                @{{ event.organizer.username }}
              </p>
            </div>
            <span v-if="event.isOrganizer" class="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              Вы
            </span>
          </div>
        </section>

        <!-- Участники -->
        <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-bold text-text">Участники</h3>
            <span class="text-sm text-textSecondary">{{ participantCount }}</span>
          </div>

          <div v-if="!event.participants || event.participants.length === 0" class="text-center py-6">
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
              <svg class="w-6 h-6 text-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p class="text-textSecondary text-sm">Нет участников</p>
          </div>

          <div v-else class="space-y-2">
            <div 
              v-for="participant in event.participants" 
              :key="participant.id"
              class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primaryLight flex items-center justify-center text-white font-semibold">
                {{ getParticipantInitial(participant) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-text truncate">{{ participant.contact?.name || 'Участник' }}</p>
                <p v-if="participant.contact?.username" class="text-xs text-textSecondary">
                  @{{ participant.contact.username }}
                </p>
              </div>
              <span 
                class="text-xs px-2 py-1 rounded-full font-medium"
                :class="getParticipantStatusClass(participant.status)"
              >
                {{ getParticipantStatusLabel(participant.status) }}
              </span>
            </div>
          </div>
        </section>

        <!-- Кнопка удаления для организатора -->
        <button
          v-if="event.isOrganizer"
          @click="showDeleteConfirm = true"
          class="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Удалить событие
        </button>
      </div>

      <!-- Модальное окно редактирования -->
      <Teleport to="body">
        <Transition name="modal">
          <div 
            v-if="showEditMode" 
            class="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
            @click.self="showEditMode = false"
          >
            <div class="min-h-screen flex items-start justify-center p-4 pt-12">
              <div class="bg-white w-full max-w-lg rounded-3xl overflow-hidden">
                <div class="p-4 border-b flex items-center justify-between">
                  <h3 class="text-lg font-bold text-text">Редактировать событие</h3>
                  <button 
                    @click="showEditMode = false"
                    class="text-textSecondary hover:text-text"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div class="p-4">
                  <EventForm
                    v-if="event"
                    :event="event"
                    :is-submitting="isUpdating"
                    submit-label="Сохранить"
                    @submit="handleUpdate"
                    @cancel="showEditMode = false"
                  />
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Модальное окно подтверждения отмены -->
      <Teleport to="body">
        <Transition name="modal">
          <div 
            v-if="showCancelConfirm" 
            class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            @click.self="showCancelConfirm = false"
          >
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 text-center">
              <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-text mb-2">Отменить событие?</h3>
              <p class="text-textSecondary mb-6">Все участники получат уведомление об отмене</p>
              <div class="flex gap-3">
                <button
                  @click="showCancelConfirm = false"
                  class="flex-1 px-4 py-3 bg-gray-100 text-text rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Нет
                </button>
                <button
                  @click="handleCancel"
                  :disabled="isCancelling"
                  class="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LoadingSpinner v-if="isCancelling" size="small" color="white" />
                  <span>Да, отменить</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Модальное окно подтверждения удаления -->
      <Teleport to="body">
        <Transition name="modal">
          <div 
            v-if="showDeleteConfirm" 
            class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            @click.self="showDeleteConfirm = false"
          >
            <div class="bg-white w-full max-w-sm rounded-3xl p-6 text-center">
              <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-text mb-2">Удалить событие?</h3>
              <p class="text-textSecondary mb-6">Это действие нельзя отменить</p>
              <div class="flex gap-3">
                <button
                  @click="showDeleteConfirm = false"
                  class="flex-1 px-4 py-3 bg-gray-100 text-text rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Отмена
                </button>
                <button
                  @click="handleDelete"
                  :disabled="isDeleting"
                  class="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LoadingSpinner v-if="isDeleting" size="small" color="white" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEvents, type Event, type EventType, type EventStatus, type EventParticipant, type UpdateEventData } from '~/composables/useEvents'
import { useNotifications } from '~/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const { 
  currentEvent: event, 
  isLoading, 
  error, 
  fetchEvent, 
  updateEvent, 
  cancelEvent, 
  deleteEvent,
  clearCurrentEvent 
} = useEvents()
const { showSuccess, showError } = useNotifications()

// Состояние модальных окон
const showEditMode = ref(false)
const showCancelConfirm = ref(false)
const showDeleteConfirm = ref(false)

// Состояние операций
const isUpdating = ref(false)
const isCancelling = ref(false)
const isDeleting = ref(false)

// Вычисляемые свойства
const typeIcon = computed(() => {
  const icons: Record<EventType, string> = {
    meeting: '🤝',
    call: '📞',
    trip: '✈️',
    other: '📅'
  }
  return icons[event.value?.type || 'other'] || '📅'
})

const iconBackgroundClass = computed(() => {
  const classes: Record<EventType, string> = {
    meeting: 'bg-purple-100',
    call: 'bg-green-100',
    trip: 'bg-blue-100',
    other: 'bg-gray-100'
  }
  return classes[event.value?.type || 'other'] || 'bg-gray-100'
})

const typeLabel = computed(() => {
  if (event.value?.type === 'other' && event.value.customType) {
    return event.value.customType
  }
  const labels: Record<EventType, string> = {
    meeting: 'Встреча',
    call: 'Звонок',
    trip: 'Поездка',
    other: 'Другое'
  }
  return labels[event.value?.type || 'other'] || 'Событие'
})

const statusLabel = computed(() => {
  const labels: Record<EventStatus, string> = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено'
  }
  return labels[event.value?.status || 'scheduled'] || event.value?.status
})

const statusClass = computed(() => {
  const classes: Record<EventStatus, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[event.value?.status || 'scheduled'] || 'bg-gray-100 text-gray-600'
})

const formattedDate = computed(() => {
  if (!event.value) return ''
  const date = new Date(event.value.startDate)
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const formattedTime = computed(() => {
  if (!event.value) return ''
  const start = new Date(event.value.startDate)
  const end = new Date(event.value.endDate)
  return `${start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
})

const durationLabel = computed(() => {
  if (!event.value) return ''
  const minutes = event.value.duration
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} ч`
  return `${hours} ч ${mins} мин`
})

const reminderLabel = computed(() => {
  if (!event.value) return ''
  const minutes = event.value.reminderMinutes
  if (minutes < 60) return `За ${minutes} минут`
  if (minutes === 60) return 'За 1 час'
  if (minutes === 1440) return 'За 1 день'
  const hours = Math.floor(minutes / 60)
  return `За ${hours} часов`
})

const recurrenceLabel = computed(() => {
  if (!event.value?.isRecurring) return ''
  const labels: Record<string, string> = {
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    custom: event.value.recurrenceInterval ? `Каждые ${event.value.recurrenceInterval} дней` : 'Повторяется'
  }
  return labels[event.value.recurrencePattern || ''] || 'Повторяется'
})

const organizerName = computed(() => {
  if (!event.value?.organizer) return 'Организатор'
  const { firstName, lastName, username } = event.value.organizer
  if (firstName || lastName) {
    return `${firstName || ''} ${lastName || ''}`.trim()
  }
  return username || 'Организатор'
})

const organizerInitial = computed(() => {
  return organizerName.value.charAt(0).toUpperCase()
})

const participantCount = computed(() => {
  const count = event.value?.participants?.length || 0
  if (count === 0) return 'Нет участников'
  if (count === 1) return '1 участник'
  if (count < 5) return `${count} участника`
  return `${count} участников`
})

/**
 * Получить инициал участника
 */
const getParticipantInitial = (participant: EventParticipant): string => {
  return (participant.contact?.name || 'У').charAt(0).toUpperCase()
}

/**
 * Получить класс статуса участника
 */
const getParticipantStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-600'
}

/**
 * Получить название статуса участника
 */
const getParticipantStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Ожидает',
    accepted: 'Принял',
    declined: 'Отклонил'
  }
  return labels[status] || status
}

/**
 * Загрузить событие
 */
const loadEvent = async () => {
  const eventId = parseInt(route.params.id as string)
  if (isNaN(eventId)) {
    router.push('/')
    return
  }
  
  try {
    await fetchEvent(eventId)
  } catch (err) {
    console.error('Ошибка загрузки события:', err)
  }
}

/**
 * Обработка обновления события
 */
const handleUpdate = async (data: UpdateEventData) => {
  if (!event.value) return
  
  try {
    isUpdating.value = true
    await updateEvent(event.value.id, data)
    showEditMode.value = false
    showSuccess('Событие обновлено!', '✅')
    await loadEvent()
  } catch (err: any) {
    showError(err.data?.statusMessage || 'Не удалось обновить событие', '❌')
  } finally {
    isUpdating.value = false
  }
}

/**
 * Обработка отмены события
 */
const handleCancel = async () => {
  if (!event.value) return
  
  try {
    isCancelling.value = true
    await cancelEvent(event.value.id)
    showCancelConfirm.value = false
    showSuccess('Событие отменено', '📅')
    await loadEvent()
  } catch (err: any) {
    showError(err.data?.statusMessage || 'Не удалось отменить событие', '❌')
  } finally {
    isCancelling.value = false
  }
}

/**
 * Обработка удаления события
 */
const handleDelete = async () => {
  if (!event.value) return
  
  try {
    isDeleting.value = true
    await deleteEvent(event.value.id)
    showSuccess('Событие удалено', '🗑️')
    router.push('/')
  } catch (err: any) {
    showError(err.data?.statusMessage || 'Не удалось удалить событие', '❌')
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

/**
 * Обработка возврата назад
 */
const handleBack = () => {
  clearCurrentEvent()
  router.back()
}

onMounted(() => {
  loadEvent()
})
</script>

<style scoped>
/* Анимация модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
