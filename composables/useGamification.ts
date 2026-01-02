import { ref, computed } from 'vue'

/**
 * Интерфейс статистики пользователя
 */
interface UserStats {
  currentStreak: number
  longestStreak: number
  totalXP: number
  level: number
  xpForNextLevel: number
  xpProgress: number
}

/**
 * Интерфейс достижения
 */
interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  xpReward: number
  criteria: Record<string, any>
  unlocked: boolean
  unlockedAt?: string
  progress?: number
}

/**
 * Composable для управления геймификацией
 * Получает статистику пользователя и достижения
 */
export const useGamification = () => {
  // Состояние
  const stats = ref<UserStats | null>(null)
  const achievements = ref<Achievement[]>([])
  const isLoadingStats = ref(false)
  const isLoadingAchievements = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const currentStreak = computed(() => stats.value?.currentStreak || 0)
  const longestStreak = computed(() => stats.value?.longestStreak || 0)
  const totalXP = computed(() => stats.value?.totalXP || 0)
  const level = computed(() => stats.value?.level || 1)
  const xpForNextLevel = computed(() => stats.value?.xpForNextLevel || 100)
  const xpProgress = computed(() => stats.value?.xpProgress || 0)

  const unlockedAchievements = computed(() => 
    achievements.value.filter(a => a.unlocked)
  )

  const lockedAchievements = computed(() => 
    achievements.value.filter(a => !a.unlocked)
  )

  const achievementCount = computed(() => ({
    unlocked: unlockedAchievements.value.length,
    total: achievements.value.length
  }))

  /**
   * Получить статистику пользователя из API
   */
  const fetchStats = async () => {
    try {
      isLoadingStats.value = true
      error.value = null

      const data = await $fetch<{ stats: UserStats }>('/api/gamification/stats', {
        method: 'GET'
      })

      stats.value = data.stats
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить статистику'
      console.error('Ошибка загрузки статистики:', err)
      throw err
    } finally {
      isLoadingStats.value = false
    }
  }

  /**
   * Получить достижения из API
   */
  const fetchAchievements = async () => {
    try {
      isLoadingAchievements.value = true
      error.value = null

      const data = await $fetch<{ achievements: Achievement[] }>('/api/gamification/achievements', {
        method: 'GET'
      })

      achievements.value = data.achievements || []
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить достижения'
      console.error('Ошибка загрузки достижений:', err)
      throw err
    } finally {
      isLoadingAchievements.value = false
    }
  }

  /**
   * Загрузить все данные геймификации
   */
  const fetchAll = async () => {
    await Promise.all([
      fetchStats(),
      fetchAchievements()
    ])
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Вычислить прогресс до следующего уровня в процентах
   */
  const getLevelProgress = computed(() => {
    if (!stats.value) return 0
    return Math.round((stats.value.xpProgress / stats.value.xpForNextLevel) * 100)
  })

  return {
    // Состояние
    stats,
    achievements,
    isLoadingStats,
    isLoadingAchievements,
    error,
    // Вычисляемые свойства
    currentStreak,
    longestStreak,
    totalXP,
    level,
    xpForNextLevel,
    xpProgress,
    unlockedAchievements,
    lockedAchievements,
    achievementCount,
    getLevelProgress,
    // Методы
    fetchStats,
    fetchAchievements,
    fetchAll,
    clearError
  }
}
