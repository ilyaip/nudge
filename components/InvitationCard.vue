<template>
  <div 
    class="bg-backgroundSecondary rounded-2xl p-4 shadow-sm"
    :class="{ 'opacity-60': isResponded }"
  >
    <!-- Информация о событии -->
    <div class="flex items-start gap-3 mb-4">
      <!-- Иконка типа события -->
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="iconBackgroundClass"
      >
        <span class="text-xl">{{ typeIcon }}</span>
      </div>
      
      <!-- Детали события -->
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-text truncate">{{ invitation.event?.title || 'Событие' }}</h3>
        
        <!-- Дата и время -->
        <p class="text-sm text-textSecondary mt-0.5">
          {{ formattedDate }}
          <span v-if="formattedTime"> • {{ formattedTime }}</span>
        </p>
        
        <!-- Тип события (если кастомный) -->
        <p v-if="invitation.event?.type === 'other' && invitation.event?.customType" class="text-xs text-textSecondary mt-0.5">
          {{ invitation.event.customType }}
        </p>
        
        <!-- Статус события -->
        <span 
          v-if="showEventStatus"
          class="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full"
          :class="eventStatusClass"
        >
          {{ eventStatusLabel }}
        </span>
      </div>
    </div>
    
    <!-- Информация о пригласившем -->
    <div class="flex items-center gap-2 mb-4 px-1">
      <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primaryLight flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
        {{ inviterInitial }}
      </div>
      <p class="text-sm text-textSecondary">
        <span class="font-medium text-text">{{ inviterName }}</span> приглашает вас
      </p>
    </div>
    
    <!-- Кнопки действий (только для pending) -->
    <div v-if="!isResponded" class="flex gap-2">
      <button
        @click="handleDecline"
        :disabled="isResponding"
        class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 text-text text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <LoadingSpinner v-if="isResponding && respondingAction === 'decline'" size="small" />
        <span v-else>❌</span>
        <span>Отклонить</span>
      </button>
      
      <button
        @click="handleAccept"
        :disabled="isResponding"
        class="flex-1 px-4 py-2.5 bg-primary hover:bg-primaryLight disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <LoadingSpinner v-if="isResponding && respondingAction === 'accept'" size="small" color="white" />
        <span v-else>✅</span>
        <span>Принять</span>
      </button>
    </div>
    
    <!-- Статус ответа (для отвеченных) -->
    <div v-else class="flex items-center justify-center gap-2 py-2">
      <span 
        class="text-sm font-medium px-3 py-1.5 rounded-lg"
        :class="responseStatusClass"
      >
        {{ responseStatusLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Invitation } from '~/composables/useInvitations'

interface Props {
  /** Данные приглашения */
  invitation: Invitation
  /** Показывать статус события */
  showEventStatus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showEventStatus: false
})

const emit = defineEmits<{
  (e: 'accept', invitation: Invitation): void
  (e: 'decline', invitation: Invitation): void
}>()

// Локальное состояние для отслеживания процесса ответа
const isResponding = ref(false)
const respondingAction = ref<'accept' | 'decline' | null>(null)

/**
 * Проверка, был ли дан ответ на приглашение
 */
const isResponded = computed(() => {
  return props.invitation.status !== 'pending'
})

/**
 * Иконка типа события
 */
const typeIcon = computed(() => {
  const type = props.invitation.event?.type || 'other'
  const icons: Record<string, string> = {
    meeting: '🤝',
    call: '📞',
    trip: '✈️',
    other: '📅'
  }
  return icons[type] || '📅'
})

/**
 * Класс фона для иконки
 */
const iconBackgroundClass = computed(() => {
  const type = props.invitation.event?.type || 'other'
  const classes: Record<string, string> = {
    meeting: 'bg-purple-100',
    call: 'bg-green-100',
    trip: 'bg-blue-100',
    other: 'bg-gray-100'
  }
  return classes[type] || 'bg-gray-100'
})

/**
 * Форматированная дата
 */
const formattedDate = computed(() => {
  if (!props.invitation.event?.startDate) return ''
  
  const date = new Date(props.invitation.event.startDate)
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
})

/**
 * Форматированное время
 */
const formattedTime = computed(() => {
  if (!props.invitation.event?.startDate) return ''
  
  const date = new Date(props.invitation.event.startDate)
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
})

/**
 * Имя пригласившего
 */
const inviterName = computed(() => {
  const inviter = props.invitation.inviter
  if (!inviter) return 'Пользователь'
  
  const parts = []
  if (inviter.firstName) parts.push(inviter.firstName)
  if (inviter.lastName) parts.push(inviter.lastName)
  
  if (parts.length > 0) {
    return parts.join(' ')
  }
  
  return inviter.username ? `@${inviter.username}` : 'Пользователь'
})

/**
 * Инициал пригласившего
 */
const inviterInitial = computed(() => {
  const name = inviterName.value
  if (name.startsWith('@')) {
    return name.charAt(1).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
})

/**
 * Статус события
 */
const eventStatusLabel = computed(() => {
  const status = props.invitation.event?.status
  const labels: Record<string, string> = {
    scheduled: 'Запланировано',
    in_progress: 'Сейчас',
    completed: 'Завершено',
    cancelled: 'Отменено'
  }
  return labels[status || ''] || ''
})

/**
 * Класс статуса события
 */
const eventStatusClass = computed(() => {
  const status = props.invitation.event?.status
  const classes: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status || ''] || 'bg-gray-100 text-gray-600'
})

/**
 * Статус ответа
 */
const responseStatusLabel = computed(() => {
  if (props.invitation.status === 'accepted') {
    return '✅ Вы приняли приглашение'
  }
  if (props.invitation.status === 'declined') {
    return '❌ Вы отклонили приглашение'
  }
  return ''
})

/**
 * Класс статуса ответа
 */
const responseStatusClass = computed(() => {
  if (props.invitation.status === 'accepted') {
    return 'bg-green-100 text-green-700'
  }
  if (props.invitation.status === 'declined') {
    return 'bg-gray-100 text-gray-600'
  }
  return ''
})

/**
 * Обработчик принятия приглашения
 */
const handleAccept = () => {
  isResponding.value = true
  respondingAction.value = 'accept'
  emit('accept', props.invitation)
}

/**
 * Обработчик отклонения приглашения
 */
const handleDecline = () => {
  isResponding.value = true
  respondingAction.value = 'decline'
  emit('decline', props.invitation)
}

/**
 * Сброс состояния загрузки (вызывается родителем после завершения)
 */
const resetLoading = () => {
  isResponding.value = false
  respondingAction.value = null
}

// Экспортируем метод для родительского компонента
defineExpose({ resetLoading })
</script>
