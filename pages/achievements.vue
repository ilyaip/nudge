<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <!-- Заголовок -->
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Достижения</h1>
      <p class="text-gray-600 mt-1">Ваши награды и прогресс</p>
    </header>

    <!-- Состояние загрузки -->
    <SkeletonLoader 
      v-if="isLoading" 
      type="grid" 
      :count="6" 
      show-header 
    />

    <!-- Ошибка -->
    <ErrorMessage
      v-else-if="error"
      :message="error"
      title="Ошибка загрузки достижений"
      type="error"
      retryable
      :on-retry="loadAchievements"
    />

    <!-- Основной контент -->
    <div v-else class="space-y-6">
      <!-- Статистика достижений -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Прогресс</h2>
            <p class="text-sm text-gray-600 mt-1">
              Разблокировано {{ achievementCount.unlocked }} из {{ achievementCount.total }} достижений
            </p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-purple-600">
              {{ achievementCompletionPercentage }}%
            </div>
            <p class="text-xs text-gray-500 mt-1">завершено</p>
          </div>
        </div>

        <!-- Прогресс-бар -->
        <div class="mt-4">
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              :style="{ width: `${achievementCompletionPercentage}%` }"
            ></div>
          </div>
        </div>
      </section>

      <!-- Разблокированные достижения -->
      <section v-if="unlockedAchievements.length > 0">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          Разблокированные ({{ unlockedAchievements.length }})
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            v-for="achievement in unlockedAchievements" 
            :key="achievement.id"
            class="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex items-start gap-4">
              <!-- Иконка -->
              <div class="text-5xl flex-shrink-0">{{ achievement.icon }}</div>
              
              <!-- Информация -->
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-yellow-900">{{ achievement.name }}</h3>
                <p class="text-sm text-yellow-800 mt-1">{{ achievement.description }}</p>
                
                <!-- Награда и дата -->
                <div class="flex items-center gap-3 mt-3">
                  <span class="inline-flex items-center gap-1 bg-yellow-200 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
                    <span>💎</span>
                    <span>+{{ achievement.xpReward }} XP</span>
                  </span>
                  <span class="text-xs text-yellow-700">
                    {{ formatDate(achievement.unlockedAt) }}
                  </span>
                </div>
              </div>

              <!-- Галочка -->
              <div class="text-2xl text-yellow-600 flex-shrink-0">✓</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Заблокированные достижения -->
      <section v-if="lockedAchievements.length > 0">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          Заблокированные ({{ lockedAchievements.length }})
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            v-for="achievement in lockedAchievements" 
            :key="achievement.id"
            class="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow opacity-75"
          >
            <div class="flex items-start gap-4">
              <!-- Иконка (затемненная) -->
              <div class="text-5xl flex-shrink-0 grayscale opacity-50">{{ achievement.icon }}</div>
              
              <!-- Информация -->
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg text-gray-700">{{ achievement.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ achievement.description }}</p>
                
                <!-- Награда и прогресс -->
                <div class="mt-3 space-y-2">
                  <span class="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded">
                    <span>💎</span>
                    <span>+{{ achievement.xpReward }} XP</span>
                  </span>
                  
                  <!-- Прогресс к достижению -->
                  <div v-if="achievement.progress !== undefined" class="mt-2">
                    <div class="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Прогресс</span>
                      <span>{{ achievement.progress }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        class="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        :style="{ width: `${achievement.progress}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Замок -->
              <div class="text-2xl text-gray-400 flex-shrink-0">🔒</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Пустое состояние -->
      <section v-if="achievements.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="text-6xl mb-4">🎯</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Нет достижений</h3>
        <p class="text-gray-600">Достижения появятся после настройки системы</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGamification } from '~/composables/useGamification'

// Composable для геймификации
const {
  achievements,
  unlockedAchievements,
  lockedAchievements,
  achievementCount,
  fetchAchievements,
  fetchStats,
  stats,
  error,
  isLoadingAchievements
} = useGamification()

// Локальное состояние
const isLoading = computed(() => isLoadingAchievements.value)

/**
 * Вычислить процент завершения достижений
 */
const achievementCompletionPercentage = computed(() => {
  if (achievementCount.value.total === 0) return 0
  return Math.round((achievementCount.value.unlocked / achievementCount.value.total) * 100)
})

/**
 * Загрузить достижения и статистику
 */
const loadAchievements = async () => {
  try {
    // Загружаем статистику и достижения
    await Promise.all([
      fetchStats(),
      fetchAchievements()
    ])
    
    // Рассчитываем прогресс для заблокированных достижений
    calculateProgress()
  } catch (err) {
    console.error('Ошибка загрузки достижений:', err)
  }
}

/**
 * Рассчитать прогресс к заблокированным достижениям
 */
const calculateProgress = () => {
  if (!stats.value) return

  const userStats = stats.value
  
  // Для каждого заблокированного достижения рассчитываем прогресс
  lockedAchievements.value.forEach(achievement => {
    const criteria = achievement.criteria
    let progress = 0

    // Прогресс по количеству контактов
    if (criteria.minContacts) {
      // Здесь нужно получить количество контактов из API
      // Пока используем заглушку
      progress = 0
    }
    
    // Прогресс по количеству выполненных напоминаний
    else if (criteria.minRemindersCompleted) {
      // Здесь нужно получить количество выполненных напоминаний из API
      // Пока используем заглушку
      progress = 0
    }
    
    // Прогресс по стрику
    else if (criteria.minStreak) {
      const currentStreak = userStats.currentStreak || 0
      progress = Math.min(100, Math.round((currentStreak / criteria.minStreak) * 100))
    }
    
    // Прогресс по уровню
    else if (criteria.minLevel) {
      const currentLevel = userStats.level || 1
      progress = Math.min(100, Math.round((currentLevel / criteria.minLevel) * 100))
    }
    
    // Прогресс по XP
    else if (criteria.minXP) {
      const currentXP = userStats.totalXP || 0
      progress = Math.min(100, Math.round((currentXP / criteria.minXP) * 100))
    }

    // Добавляем прогресс к достижению
    achievement.progress = progress
  })
}

/**
 * Форматировать дату разблокировки
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Сегодня'
  } else if (diffDays === 1) {
    return 'Вчера'
  } else if (diffDays < 7) {
    return `${diffDays} дн. назад`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} нед. назад`
  } else {
    const months = Math.floor(diffDays / 30)
    return `${months} мес. назад`
  }
}

// Загрузить достижения при монтировании компонента
onMounted(() => {
  loadAchievements()
})
</script>
