<template>
  <div class="activity-chart">
    <!-- Заголовок с переключателем периода -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900">График активности</h3>
      
      <!-- Переключатель периода -->
      <div class="flex gap-2 bg-gray-100 rounded-lg p-1">
        <button
          @click="handlePeriodChange('week')"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            currentPeriod === 'week'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:scale-105'
          ]"
        >
          Неделя
        </button>
        <button
          @click="handlePeriodChange('month')"
          :class="[
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            currentPeriod === 'month'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:scale-105'
          ]"
        >
          Месяц
        </button>
      </div>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800 text-sm">{{ error }}</p>
      <button 
        @click="retry" 
        class="mt-2 text-red-600 hover:text-red-800 hover:scale-105 underline text-sm transition-all"
      >
        Попробовать снова
      </button>
    </div>

    <!-- График -->
    <div v-else>
      <!-- Статистика -->
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-purple-50 rounded-lg p-4">
          <p class="text-sm text-primary font-medium">Всего выполнено</p>
          <p class="text-2xl font-bold text-primary">{{ totalCompleted }}</p>
          <p class="text-xs text-primary mt-1">напоминаний</p>
        </div>
        
        <div class="bg-purple-50 rounded-lg p-4">
          <p class="text-sm text-primary font-medium">Заработано XP</p>
          <p class="text-2xl font-bold text-primary">{{ totalXP }}</p>
          <p class="text-xs text-primary mt-1">за период</p>
        </div>
      </div>

      <!-- Средняя активность -->
      <div class="mb-4 text-center">
        <p class="text-sm text-gray-600">
          Среднее: <span class="font-semibold text-gray-900">{{ averagePerDay }}</span> напоминаний в день
        </p>
      </div>

      <!-- Столбчатая диаграмма -->
      <div class="relative">
        <!-- Сетка -->
        <div class="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div v-for="i in 5" :key="i" class="border-t border-gray-200"></div>
        </div>

        <!-- Столбцы -->
        <div class="relative flex items-end justify-between gap-1 h-48 pt-4">
          <div
            v-for="activity in activities"
            :key="activity.date"
            @mouseenter="showTooltip(activity)"
            @mouseleave="hideTooltip"
            class="flex-1 flex flex-col items-center relative group"
          >
            <!-- Столбец -->
            <div class="relative w-full flex items-end justify-center">
              <div
                :style="{ height: getBarHeight(activity.completedReminders) }"
                :class="[
                  'w-full rounded-t-lg cursor-pointer activity-bar',
                  getBarColorClass(activity.completedReminders),
                  activity.completedReminders > 0 ? 'group-hover:scale-105' : ''
                ]"
              >
                <!-- Tooltip при наведении -->
                <div 
                  v-if="hoveredDay && hoveredDay.date === activity.date" 
                  class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10"
                >
                  <div class="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
                    <p class="font-semibold">{{ formatDateLabel(activity.date) }}</p>
                    <p class="mt-1">{{ activity.completedReminders }} напоминаний</p>
                    <p>{{ activity.xpEarned }} XP</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Метка даты -->
            <p class="text-xs text-gray-500 mt-2 text-center">
              {{ getDateLabel(activity.date) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Легенда -->
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-gradient-to-t from-primaryDark to-primary"></div>
          <span>Высокая (>5)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-gradient-to-t from-primary to-primaryLight"></div>
          <span>Средняя (2-5)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-gradient-to-t from-primaryLight to-[#A78BFA]"></div>
          <span>Низкая (1)</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded bg-gray-200"></div>
          <span>Нет активности</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useActivity, type ActivityPeriod } from '~/composables/useActivity'

// Composable для работы с данными активности
const {
  activities,
  totalCompleted,
  totalXP,
  currentPeriod,
  isLoading,
  error,
  maxValue,
  averagePerDay,
  switchPeriod,
  fetchActivity
} = useActivity()

// Состояние для tooltip
const hoveredDay = ref<{ date: string; completedReminders: number; xpEarned: number } | null>(null)

/**
 * Показать tooltip для дня
 */
const showTooltip = (day: { date: string; completedReminders: number; xpEarned: number }) => {
  hoveredDay.value = day
}

/**
 * Скрыть tooltip
 */
const hideTooltip = () => {
  hoveredDay.value = null
}

/**
 * Обработать изменение периода
 */
const handlePeriodChange = async (period: ActivityPeriod) => {
  await switchPeriod(period)
}

/**
 * Повторить загрузку данных
 */
const retry = async () => {
  await fetchActivity(currentPeriod.value)
}

/**
 * Получить высоту столбца в процентах
 */
const getBarHeight = (value: number): string => {
  if (maxValue.value === 0) return '0%'
  const percentage = (value / maxValue.value) * 100
  return `${Math.max(percentage, value > 0 ? 5 : 0)}%` // Минимум 5% для видимости
}

/**
 * Получить класс цвета столбца в зависимости от интенсивности активности
 * - Высокая активность (>5 напоминаний): темный фиолетовый
 * - Средняя активность (2-5): средний фиолетовый
 * - Низкая активность (1): светлый фиолетовый
 * - Нет активности: серый
 */
const getBarColorClass = (completedReminders: number): string => {
  if (completedReminders === 0) {
    return 'bg-gray-200'
  } else if (completedReminders === 1) {
    // Низкая активность - светлый фиолетовый
    return 'bg-gradient-to-t from-primaryLight to-[#A78BFA]'
  } else if (completedReminders >= 2 && completedReminders <= 5) {
    // Средняя активность - средний фиолетовый
    return 'bg-gradient-to-t from-primary to-primaryLight'
  } else {
    // Высокая активность (>5) - темный фиолетовый
    return 'bg-gradient-to-t from-primaryDark to-primary'
  }
}

/**
 * Получить короткую метку даты для оси X
 */
const getDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr)
  const day = date.getDate()
  
  if (currentPeriod.value === 'week') {
    // Для недели показываем день недели
    const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    return weekdays[date.getDay()]
  } else {
    // Для месяца показываем число
    return String(day)
  }
}

/**
 * Форматировать дату для tooltip
 */
const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.getMonth() + 1
  return `${day}.${month}`
}
</script>

<style scoped>
.activity-bar {
  /* Анимация роста столбцов - 500ms для высоты */
  transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
              background-color 300ms ease;
}

/* Плавная анимация при изменении данных */
.activity-bar:not(.bg-gray-200) {
  animation: bar-grow 500ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes bar-grow {
  from {
    transform: scaleY(0);
    transform-origin: bottom;
  }
  to {
    transform: scaleY(1);
    transform-origin: bottom;
  }
}
</style>
