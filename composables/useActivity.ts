import { ref, computed } from 'vue'

/**
 * Тип периода для агрегации активности
 */
export type ActivityPeriod = 'week' | 'month'

/**
 * Интерфейс данных активности за день
 */
export interface DailyActivity {
  date: string // YYYY-MM-DD
  completedReminders: number
  xpEarned: number
}

/**
 * Интерфейс агрегированных данных активности
 */
export interface ActivityData {
  period: ActivityPeriod
  startDate: string
  endDate: string
  activities: DailyActivity[]
  totalCompleted: number
  totalXP: number
}

/**
 * Composable для управления данными активности
 * Получает агрегированные данные активности пользователя
 */
export const useActivity = () => {
  // Состояние
  const activityData = ref<ActivityData | null>(null)
  const currentPeriod = ref<ActivityPeriod>('week')
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const activities = computed(() => activityData.value?.activities || [])
  const totalCompleted = computed(() => activityData.value?.totalCompleted || 0)
  const totalXP = computed(() => activityData.value?.totalXP || 0)
  const startDate = computed(() => activityData.value?.startDate || '')
  const endDate = computed(() => activityData.value?.endDate || '')

  /**
   * Получить данные активности из API
   * 
   * @param period - Период агрегации ('week' или 'month')
   */
  const fetchActivity = async (period: ActivityPeriod = 'week') => {
    try {
      isLoading.value = true
      error.value = null
      currentPeriod.value = period

      const data = await $fetch<{ success: boolean; data: ActivityData }>(
        `/api/gamification/activity?period=${period}`,
        {
          method: 'GET'
        }
      )

      activityData.value = data.data
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить данные активности'
      console.error('Ошибка загрузки данных активности:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Переключить период отображения
   * 
   * @param period - Новый период ('week' или 'month')
   */
  const switchPeriod = async (period: ActivityPeriod) => {
    if (period !== currentPeriod.value) {
      await fetchActivity(period)
    }
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Получить максимальное значение для масштабирования графика
   */
  const maxValue = computed(() => {
    if (!activities.value.length) return 0
    return Math.max(...activities.value.map(a => a.completedReminders))
  })

  /**
   * Получить среднее количество завершенных напоминаний за день
   */
  const averagePerDay = computed(() => {
    if (!activities.value.length) return 0
    return Math.round((totalCompleted.value / activities.value.length) * 10) / 10
  })

  return {
    // Состояние
    activityData,
    currentPeriod,
    isLoading,
    error,
    // Вычисляемые свойства
    activities,
    totalCompleted,
    totalXP,
    startDate,
    endDate,
    maxValue,
    averagePerDay,
    // Методы
    fetchActivity,
    switchPeriod,
    clearError
  }
}
