<template>
  <div 
    class="bg-backgroundSecondary rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    :class="{ 'opacity-60': event.status === 'cancelled' }"
    @click="handleClick"
  >
    <div class="flex items-center gap-3">
      <!-- Иконка типа события -->
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        :class="iconBackgroundClass"
      >
        <span class="text-xl">{{ typeIcon }}</span>
      </div>
      
      <!-- Информация о событии -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <h3 class="font-semibold text-text truncate">{{ event.title }}</h3>
          <!-- Бейдж статуса для отменённых/завершённых -->
          <span 
            v-if="showStatusBadge"
            class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            :class="statusBadgeClass"
          >
            {{ statusLabel }}
          </span>
        </div>
        
        <!-- Дата и время -->
        <p class="text-sm text-textSecondary">
          {{ formattedDate }}
          <span v-if="formattedTime"> • {{ formattedTime }}</span>
        </p>
        
        <!-- Тип события (если кастомный) -->
        <p v-if="event.type === 'other' && event.customType" class="text-xs text-textSecondary mt-0.5">
          {{ event.customType }}
        </p>
      </div>
      
      <!-- Участники -->
      <div v-if="showParticipants && participantCount > 0" class="flex items-center gap-1 flex-shrink-0">
        <!-- Аватары участников (максимум 3) -->
        <div class="flex -space-x-2">
          <div 
            v-for="(participant, index) in displayedParticipants" 
            :key="participant.id || index"
            class="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primaryLight flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
            :title="participant.contact?.name || 'Участник'"
          >
            {{ getParticipantInitial(participant) }}
          </div>
        </div>
        <!-- Счётчик дополнительных участников -->
        <span v-if="participantCount > 3" class="text-xs text-textSecondary ml-1">
          +{{ participantCount - 3 }}
        </span>
      </div>
      
      <!-- Стрелка навигации -->
      <div v-if="showArrow" class="text-textSecondary flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Event, EventParticipant, EventType, EventStatus } from '~/composables/useEvents'

interface Props {
  /** Данные события */
  event: Event
  /** Показывать участников */
  showParticipants?: boolean
  /** Показывать стрелку навигации */
  showArrow?: boolean
  /** Компактный режим (для горизонтального скролла) */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showParticipants: true,
  showArrow: true,
  compact: false
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
}>()

/**
 * Иконка типа события
 */
const typeIcon = computed(() => {
  const icons: Record<EventType, string> = {
    meeting: '🤝',
    call: '📞',
    trip: '✈️',
    other: '📅'
  }
  return icons[props.event.type] || '📅'
})

/**
 * Класс фона для иконки
 */
const iconBackgroundClass = computed(() => {
  const classes: Record<EventType, string> = {
    meeting: 'bg-purple-100',
    call: 'bg-green-100',
    trip: 'bg-blue-100',
    other: 'bg-gray-100'
  }
  return classes[props.event.type] || 'bg-gray-100'
})

/**
 * Форматированная дата
 */
const formattedDate = computed(() => {
  const date = new Date(props.event.startDate)
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
  const date = new Date(props.event.startDate)
  return date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
})

/**
 * Количество участников
 */
const participantCount = computed(() => {
  return props.event.participantCount || props.event.participants?.length || 0
})

/**
 * Участники для отображения (максимум 3)
 */
const displayedParticipants = computed(() => {
  const participants = props.event.participants || []
  return participants.slice(0, 3)
})

/**
 * Показывать бейдж статуса
 */
const showStatusBadge = computed(() => {
  return props.event.status === 'cancelled' || props.event.status === 'completed' || props.event.status === 'in_progress'
})

/**
 * Название статуса
 */
const statusLabel = computed(() => {
  const labels: Record<EventStatus, string> = {
    scheduled: 'Запланировано',
    in_progress: 'Сейчас',
    completed: 'Завершено',
    cancelled: 'Отменено'
  }
  return labels[props.event.status] || props.event.status
})

/**
 * Класс бейджа статуса
 */
const statusBadgeClass = computed(() => {
  const classes: Record<EventStatus, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[props.event.status] || 'bg-gray-100 text-gray-600'
})

/**
 * Получить инициал участника
 */
const getParticipantInitial = (participant: EventParticipant): string => {
  const name = participant.contact?.name || 'У'
  return name.charAt(0).toUpperCase()
}

/**
 * Обработчик клика
 */
const handleClick = () => {
  emit('click', props.event)
}
</script>

<style scoped>
/* Анимация при наведении */
.hover\:shadow-md:hover {
  transform: translateY(-1px);
}
</style>
