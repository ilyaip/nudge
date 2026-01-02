<template>
  <div class="min-h-screen bg-gray-50 p-4 pb-20">
    <!-- Заголовок -->
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600 mt-1">Добро пожаловать в Nudge!</p>
    </header>

    <!-- Состояние загрузки -->
    <SkeletonLoader 
      v-if="isLoading" 
      type="stats" 
      :count="1" 
      show-header 
      class="space-y-6"
    />

    <!-- Ошибка -->
    <ErrorMessage
      v-else-if="error"
      :message="error"
      title="Ошибка загрузки данных"
      type="error"
      retryable
      :on-retry="loadData"
    />

    <!-- Основной контент -->
    <div v-else class="space-y-6">
      <!-- Статистика геймификации -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Ваш прогресс</h2>
        
        <div class="grid grid-cols-2 gap-4 mb-6">
          <!-- Текущий стрик -->
          <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-orange-600 font-medium">Текущий стрик</p>
                <p class="text-3xl font-bold text-orange-700">{{ currentStreak }}</p>
                <p class="text-xs text-orange-600 mt-1">дней подряд</p>
              </div>
              <div class="text-4xl">🔥</div>
            </div>
          </div>

          <!-- Уровень -->
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-purple-600 font-medium">Уровень</p>
                <p class="text-3xl font-bold text-purple-700">{{ level }}</p>
                <p class="text-xs text-purple-600 mt-1">{{ totalXP }} XP</p>
              </div>
              <div class="text-4xl">⭐</div>
            </div>
          </div>
        </div>

        <!-- Прогресс-бар до следующего уровня -->
        <div class="mb-2">
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Прогресс до уровня {{ level + 1 }}</span>
            <span>{{ xpProgress }} / {{ xpForNextLevel }} XP</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              :style="{ width: `${getLevelProgress}%` }"
            ></div>
          </div>
          <p class="text-xs text-gray-500 mt-1">{{ getLevelProgress }}% завершено</p>
        </div>

        <!-- Лучший стрик -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Лучший стрик:</span>
            <span class="text-lg font-semibold text-gray-900">{{ longestStreak }} дней 🏆</span>
          </div>
        </div>
      </section>

      <!-- Виджет сегодняшних напоминаний -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Сегодняшние напоминания</h2>
          <span class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {{ reminderCount }}
          </span>
        </div>

        <!-- Список напоминаний -->
        <div v-if="reminderCount === 0" class="text-center py-8">
          <div class="text-6xl mb-3">✅</div>
          <p class="text-gray-600">Все напоминания выполнены!</p>
          <p class="text-sm text-gray-500 mt-1">Отличная работа!</p>
        </div>

        <div v-else class="space-y-3">
          <div 
            v-for="reminder in todayReminders" 
            :key="reminder.id"
            class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ reminder.contact?.name || 'Контакт' }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {{ getCategoryLabel(reminder.contact?.category) }}
                  </span>
                  <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {{ getTypeLabel(reminder.contact?.communicationType) }}
                  </span>
                </div>
                <p v-if="reminder.contact?.username" class="text-sm text-gray-500 mt-1">
                  @{{ reminder.contact.username }}
                </p>
              </div>
              
              <button
                @click="handleCompleteReminder(reminder.id)"
                :disabled="isCompletingReminder"
                class="ml-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <LoadingSpinner v-if="isCompletingReminder" size="small" color="white" />
                <span v-else>✓</span>
                <span>{{ isCompletingReminder ? 'Сохранение...' : 'Готово' }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- График активности -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <ActivityChart />
      </section>

      <!-- Достижения (краткий обзор) -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Достижения</h2>
          <span class="text-sm text-gray-600">
            {{ achievementCount.unlocked }} / {{ achievementCount.total }}
          </span>
        </div>

        <div v-if="unlockedAchievements.length === 0" class="text-center py-8">
          <div class="text-5xl mb-3">🎯</div>
          <p class="text-gray-600">Пока нет достижений</p>
          <p class="text-sm text-gray-500 mt-1">Выполняйте напоминания, чтобы получить первое!</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div 
            v-for="achievement in unlockedAchievements.slice(0, 6)" 
            :key="achievement.id"
            class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 text-center"
          >
            <div class="text-3xl mb-1">{{ achievement.icon }}</div>
            <p class="text-xs font-medium text-yellow-800">{{ achievement.name }}</p>
          </div>
        </div>

        <NuxtLink 
          v-if="achievementCount.total > 0"
          to="/achievements"
          class="mt-4 w-full block text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Посмотреть все достижения →
        </NuxtLink>
      </section>
    </div>

    <!-- Нижняя навигация -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReminders } from '~/composables/useReminders'
import { useGamification } from '~/composables/useGamification'
import { useActivity } from '~/composables/useActivity'
import { useNotifications } from '~/composables/useNotifications'
import { useAuthStore } from '~/stores/auth'

// Composables
const {
  todayReminders,
  reminderCount,
  fetchReminders,
  completeReminder,
  error: remindersError
} = useReminders()

const {
  currentStreak,
  longestStreak,
  totalXP,
  level,
  xpForNextLevel,
  xpProgress,
  getLevelProgress,
  unlockedAchievements,
  achievementCount,
  fetchAll: fetchGamification,
  error: gamificationError
} = useGamification()

const {
  fetchActivity,
  error: activityError
} = useActivity()

const { showSuccess, showError } = useNotifications()

// Локальное состояние
const isLoading = ref(false)
const isCompletingReminder = ref(false)
const error = computed(() => remindersError.value || gamificationError.value || activityError.value)

/**
 * Загрузить все данные для dashboard
 */
const loadData = async () => {
  try {
    isLoading.value = true
    
    // Ждем загрузки Telegram SDK (максимум 5 секунд)
    console.log('[Dashboard] Waiting for Telegram SDK...')
    let attempts = 0
    while (!window.Telegram?.WebApp?.initData && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    
    if (window.Telegram?.WebApp?.initData) {
      console.log('[Dashboard] Telegram SDK ready')
    } else {
      console.warn('[Dashboard] Telegram SDK not ready after 5 seconds')
    }
    
    // Авторизуемся (создаем пользователя если нужно)
    // initData автоматически добавляется plugin'ом
    const authResponse = await $fetch<{ success: boolean; user: any }>('/api/auth', { method: 'POST' })
    
    console.log('[Dashboard] Auth response:', authResponse)
    
    // Сохраняем пользователя в auth store
    if (authResponse.success && authResponse.user) {
      const authStore = useAuthStore()
      authStore.setUser(authResponse.user)
      console.log('[Dashboard] User saved to store:', authResponse.user)
    }
    
    // Затем загружаем данные
    await Promise.all([
      fetchReminders(),
      fetchGamification(),
      fetchActivity('week') // Загружаем данные активности за неделю по умолчанию
    ])
  } catch (err: any) {
    console.error('[Dashboard] Ошибка загрузки данных:', err)
    console.error('[Dashboard] Error details:', err.data || err.message)
  } finally {
    isLoading.value = false
  }
}

/**
 * Обработать завершение напоминания
 */
const handleCompleteReminder = async (reminderId: number) => {
  try {
    isCompletingReminder.value = true
    await completeReminder(reminderId)
    // Обновить статистику после завершения
    await fetchGamification()
    
    // Показать уведомление об успехе
    showSuccess('Напоминание отмечено как выполненное', 'Отлично!')
  } catch (err: any) {
    console.error('Ошибка завершения напоминания:', err)
    showError(
      err.data?.statusMessage || err.message || 'Не удалось завершить напоминание',
      'Ошибка'
    )
  } finally {
    isCompletingReminder.value = false
  }
}

/**
 * Получить метку категории на русском
 */
const getCategoryLabel = (category?: string): string => {
  const labels: Record<string, string> = {
    family: 'Семья',
    friends: 'Друзья',
    colleagues: 'Коллеги',
    business: 'Бизнес'
  }
  return labels[category || ''] || category || 'Другое'
}

/**
 * Получить метку типа коммуникации на русском
 */
const getTypeLabel = (type?: string): string => {
  const labels: Record<string, string> = {
    message: 'Сообщение',
    call: 'Звонок',
    meeting: 'Встреча'
  }
  return labels[type || ''] || type || 'Контакт'
}

// Загрузить данные при монтировании компонента
onMounted(() => {
  loadData()
})
</script>
