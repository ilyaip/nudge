<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 bg-black/50 z-50 flex items-end"
        @click.self="handleClose"
      >
        <Transition name="modal-slide">
          <div 
            v-if="isOpen"
            class="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
          >
            <!-- Заголовок с навигацией по месяцам -->
            <header class="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <button 
                @click="calendar.prevMonth()"
                class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Предыдущий месяц"
              >
                <svg class="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div class="text-center">
                <h2 class="font-bold text-text text-lg">{{ calendar.currentMonthName.value }}</h2>
                <button 
                  @click="calendar.goToToday()"
                  class="text-xs text-primary font-medium hover:underline"
                >
                  Сегодня
                </button>
              </div>
              
              <button 
                @click="calendar.nextMonth()"
                class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                aria-label="Следующий месяц"
              >
                <svg class="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </header>

            <!-- Дни недели -->
            <div class="grid grid-cols-7 gap-1 px-4 py-2 border-b border-gray-100 flex-shrink-0">
              <div 
                v-for="dayName in calendar.weekDayNames" 
                :key="dayName"
                class="text-center text-xs font-semibold text-textSecondary py-1"
              >
                {{ dayName }}
              </div>
            </div>

            <!-- Сетка календаря -->
            <div class="grid grid-cols-7 gap-1 p-4 flex-shrink-0">
              <button
                v-for="(day, index) in calendar.calendarDays.value"
                :key="index"
                @click="handleDayClick(day)"
                class="relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all"
                :class="getDayClasses(day)"
              >
                <span class="text-sm font-medium">{{ day.dayNumber }}</span>
                <!-- Индикатор событий -->
                <div 
                  v-if="day.hasEvents && day.isCurrentMonth"
                  class="absolute bottom-1 flex gap-0.5"
                >
                  <span 
                    v-for="n in Math.min(day.events.length, 3)" 
                    :key="n"
                    class="w-1 h-1 rounded-full"
                    :class="day.isSelected ? 'bg-white' : 'bg-primary'"
                  />
                </div>
              </button>
            </div>

            <!-- События выбранного дня -->
            <div class="flex-1 overflow-y-auto border-t border-gray-100">
              <div class="p-4">
                <h3 class="font-semibold text-text mb-3">
                  {{ calendar.formatSelectedDate.value || 'Выберите день' }}
                </h3>
                
                <!-- Загрузка -->
                <div v-if="calendar.isLoading.value" class="flex justify-center py-8">
                  <LoadingSpinner size="medium" />
                </div>

                <!-- Нет событий -->
                <div 
                  v-else-if="calendar.selectedDayEvents.value.length === 0" 
                  class="text-center py-8"
                >
                  <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p class="text-textSecondary text-sm">Нет событий на этот день</p>
                  <NuxtLink 
                    to="/events/create"
                    class="inline-block mt-3 text-primary font-medium text-sm hover:underline"
                    @click="handleClose"
                  >
                    + Создать событие
                  </NuxtLink>
                </div>

                <!-- Список событий -->
                <div v-else class="space-y-3">
                  <EventCard
                    v-for="event in calendar.selectedDayEvents.value"
                    :key="event.id"
                    :event="event"
                    :show-arrow="true"
                    @click="handleEventClick(event)"
                  />
                </div>
              </div>
            </div>

            <!-- Кнопка закрытия -->
            <div class="p-4 border-t border-gray-100 flex-shrink-0">
              <button
                @click="handleClose"
                class="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-text transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>


<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendar, type CalendarDay } from '~/composables/useCalendar'
import type { Event } from '~/composables/useEvents'

interface Props {
  /** Открыт ли модал */
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'event-click', event: Event): void
}>()

const router = useRouter()
const calendar = useCalendar()

/**
 * Получить классы для дня календаря
 * Requirement 10.3: highlight days with events
 */
const getDayClasses = (day: CalendarDay): string => {
  const classes: string[] = []

  if (!day.isCurrentMonth) {
    classes.push('text-gray-300')
  } else if (day.isSelected) {
    classes.push('bg-primary text-white')
  } else if (day.isToday) {
    classes.push('bg-primary/10 text-primary font-bold')
  } else {
    classes.push('text-text hover:bg-gray-100')
  }

  if (day.hasEvents && day.isCurrentMonth && !day.isSelected) {
    classes.push('font-semibold')
  }

  return classes.join(' ')
}

/**
 * Обработчик клика по дню
 * Requirement 10.5: show events for selected day
 */
const handleDayClick = (day: CalendarDay) => {
  calendar.selectDay(day.date)
}

/**
 * Обработчик клика по событию
 */
const handleEventClick = (event: Event) => {
  emit('event-click', event)
  handleClose()
  router.push(`/events/${event.id}`)
}

/**
 * Закрыть модал
 */
const handleClose = () => {
  emit('close')
}

/**
 * Загрузить события при открытии модала
 */
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // Выбираем сегодняшний день по умолчанию
    if (!calendar.selectedDate.value) {
      calendar.selectDay(new Date())
    }
    await calendar.fetchMonthEvents()
  }
}, { immediate: true })

/**
 * Блокировка скролла body при открытом модале
 */
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  // Очистка при размонтировании
  return () => {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Анимация backdrop */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* Анимация slide модала */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: transform 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  transform: translateY(100%);
}
</style>
