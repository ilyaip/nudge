import { ref } from 'vue'

/**
 * Интерфейс достижения
 */
export interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  xpReward: number
}

/**
 * Текущее отображаемое достижение
 */
const currentAchievement = ref<Achievement | null>(null)

/**
 * Очередь достижений для показа
 */
const achievementQueue = ref<Achievement[]>([])

/**
 * Флаг, показывается ли модалка в данный момент
 */
const isShowing = ref(false)

/**
 * Composable для управления модальным окном разблокировки достижений
 */
export const useAchievementModal = () => {
  /**
   * Показать достижение
   * @param achievement - Данные достижения
   */
  const showAchievement = (achievement: Achievement) => {
    // Если модалка уже показывается, добавляем в очередь
    if (isShowing.value) {
      achievementQueue.value.push(achievement)
      return
    }
    
    // Показываем достижение
    currentAchievement.value = achievement
    isShowing.value = true
  }

  /**
   * Показать несколько достижений
   * @param achievements - Массив достижений
   */
  const showAchievements = (achievements: Achievement[]) => {
    if (achievements.length === 0) return
    
    // Добавляем все достижения в очередь
    achievementQueue.value.push(...achievements)
    
    // Если модалка не показывается, показываем первое
    if (!isShowing.value) {
      showNextInQueue()
    }
  }

  /**
   * Показать следующее достижение из очереди
   */
  const showNextInQueue = () => {
    if (achievementQueue.value.length === 0) {
      isShowing.value = false
      currentAchievement.value = null
      return
    }
    
    const nextAchievement = achievementQueue.value.shift()
    if (nextAchievement) {
      currentAchievement.value = nextAchievement
      isShowing.value = true
    }
  }

  /**
   * Обработать закрытие модалки
   */
  const handleClose = () => {
    // Показываем следующее достижение из очереди, если есть
    setTimeout(() => {
      showNextInQueue()
    }, 300) // Небольшая задержка для плавности
  }

  /**
   * Очистить очередь
   */
  const clearQueue = () => {
    achievementQueue.value = []
    currentAchievement.value = null
    isShowing.value = false
  }

  return {
    // Состояние
    currentAchievement,
    isShowing,
    queueLength: achievementQueue,
    // Методы
    showAchievement,
    showAchievements,
    handleClose,
    clearQueue
  }
}
