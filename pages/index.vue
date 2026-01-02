<template>
  <div class="min-h-screen bg-background pb-28 overflow-x-hidden">
    <!-- Заголовок с градиентом -->
    <header class="gradient-purple-header p-4 pb-6 rounded-b-[32px] mb-6 shadow-lg">
      <div class="flex items-center justify-between mb-6">
        <!-- Аватар -->
        <NuxtLink to="/profile" class="block">
          <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden flex items-center justify-center">
            <img 
              v-if="avatarUrl" 
              :src="avatarUrl" 
              alt="Аватар" 
              class="w-full h-full object-cover"
            />
            <span v-else class="text-white text-lg font-bold">{{ userInitials }}</span>
          </div>
        </NuxtLink>
        
        <!-- Уведомления -->
        <button class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>
      
      <p class="text-white/70 text-sm mb-1 font-medium">Ваш прогресс</p>
      <p class="text-white text-4xl font-bold mb-1">{{ totalXP }} XP</p>
      <p class="text-white/80 text-sm font-medium">Уровень {{ level }}</p>
    </header>

    <!-- Состояние загрузки -->
    <SkeletonLoader 
      v-if="isLoading" 
      type="stats" 
      :count="1" 
      show-header 
      class="space-y-4 px-4"
    />

    <!-- Ошибка -->
    <ErrorMessage
      v-else-if="error"
      :message="error"
      title="Ошибка загрузки данных"
      type="error"
      retryable
      :on-retry="loadData"
      class="px-4"
    />

    <!-- Основной контент -->
    <div v-else class="space-y-4 px-4">
      <!-- Быстрые действия -->
      <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-4">
        <div class="grid grid-cols-4 gap-2">
          <NuxtLink to="/contacts?add=true" class="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-colors">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span class="text-xs font-medium text-text text-center">Добавить</span>
          </NuxtLink>
          
          <NuxtLink to="/contacts" class="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-colors">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span class="text-xs font-medium text-text text-center">Контакты</span>
          </NuxtLink>
          
          <NuxtLink to="/achievements" class="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-colors">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span class="text-xs font-medium text-text text-center">Награды</span>
          </NuxtLink>
          
          <NuxtLink to="/profile" class="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-colors">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span class="text-xs font-medium text-text text-center">Профиль</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Статистика геймификации -->
      <section>
        <h2 class="text-lg font-bold text-text mb-3">Статистика</h2>
        
        <div class="grid grid-cols-2 gap-3">
          <!-- Streak -->
          <div class="gradient-purple-dark rounded-2xl p-4 text-white relative overflow-hidden">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 pr-2">
                <p class="text-white/70 text-xs mb-1">Стрик</p>
                <p class="text-3xl font-bold">{{ currentStreak }}</p>
                <p class="text-white/70 text-xs mt-1">дней подряд</p>
              </div>
              <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.5 1.5-4.5 3-6.5s3-4.5 3-7.5c0 3 1.5 5.5 3 7.5s3 4 3 6.5c0 3.866-3.134 7-7 7z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Level -->
          <div class="gradient-purple-bright rounded-2xl p-4 text-white relative overflow-hidden">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 pr-2">
                <p class="text-white/80 text-xs mb-1">Уровень</p>
                <p class="text-3xl font-bold">{{ level }}</p>
                <p class="text-white/80 text-xs mt-1">{{ totalXP }} XP</p>
              </div>
              <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Сегодняшние напоминания -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-text">Напоминания</h2>
          <span class="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
            {{ reminderCount }}
          </span>
        </div>

        <div class="bg-backgroundSecondary rounded-2xl shadow-sm p-4">
          <div v-if="reminderCount === 0" class="text-center py-6">
            <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-text font-semibold">Все выполнено!</p>
            <p class="text-sm text-textSecondary mt-1">Отличная работа</p>
          </div>

          <TransitionGroup v-else name="fade" tag="div" class="space-y-3">
            <div 
              v-for="reminder in todayReminders" 
              :key="reminder.id"
              class="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full gradient-purple-bright flex items-center justify-center text-xl flex-shrink-0">
                  {{ getCategoryIcon(reminder.contact?.category) }}
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-bold text-text truncate">{{ reminder.contact?.name || 'Контакт' }}</h3>
                  <p class="text-xs text-textSecondary">{{ getCategoryLabel(reminder.contact?.category) }}</p>
                </div>

                <button
                  v-ripple
                  @click="handleCompleteReminder(reminder.id)"
                  :disabled="isCompletingReminder"
                  class="w-10 h-10 rounded-xl bg-primary hover:bg-primaryLight disabled:bg-gray-300 text-white flex items-center justify-center transition-all flex-shrink-0"
                >
                  <LoadingSpinner v-if="isCompletingReminder" size="small" color="white" />
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </section>

      <!-- График активности -->
      <section class="bg-backgroundSecondary rounded-2xl shadow-sm p-4">
        <ActivityChart />
      </section>

      <!-- Достижения -->
      <section class="bg-backgroundSecondary rounded-2xl shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-text">Достижения</h2>
          <span class="text-sm text-textSecondary">
            {{ achievementCount.unlocked }}/{{ achievementCount.total }}
          </span>
        </div>

        <div v-if="unlockedAchievements.length === 0" class="text-center py-6">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p class="text-text font-semibold">Пока нет достижений</p>
          <p class="text-sm text-textSecondary mt-1">Выполняйте напоминания!</p>
        </div>

        <div v-else class="grid grid-cols-4 gap-2">
          <div 
            v-for="achievement in unlockedAchievements.slice(0, 4)" 
            :key="achievement.id"
            class="bg-yellow-50 rounded-xl p-3 text-center"
          >
            <div class="text-2xl mb-1">{{ achievement.icon }}</div>
            <p class="text-[10px] font-semibold text-yellow-800 leading-tight truncate">{{ achievement.name }}</p>
          </div>
        </div>

        <NuxtLink 
          v-if="achievementCount.total > 0"
          to="/achievements"
          class="mt-3 w-full block text-center text-primary font-semibold text-sm py-2 rounded-xl transition-colors hover:bg-primary/5"
        >
          Все достижения →
        </NuxtLink>
      </section>
    </div>

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

const authStore = useAuthStore()

const {
  todayReminders,
  reminderCount,
  fetchReminders,
  completeReminder,
  error: remindersError
} = useReminders()

const {
  currentStreak,
  totalXP,
  level,
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

const isLoading = ref(false)
const isCompletingReminder = ref(false)
const avatarUrl = ref<string | null>(null)
const error = computed(() => remindersError.value || gamificationError.value || activityError.value)

const userName = computed(() => {
  return authStore.user?.firstName 
    ? `${authStore.user.firstName}${authStore.user.lastName ? ' ' + authStore.user.lastName : ''}`
    : 'Пользователь'
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name || name === 'Пользователь') return '👤'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

const loadData = async () => {
  try {
    isLoading.value = true
    
    // Загружаем сохраненный аватар
    const savedAvatar = localStorage.getItem('userAvatar')
    if (savedAvatar) {
      avatarUrl.value = savedAvatar
    }
    
    // Ждем Telegram SDK
    let attempts = 0
    while (!window.Telegram?.WebApp?.initData && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    
    // Пробуем получить фото из Telegram
    if (!avatarUrl.value && window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url) {
      avatarUrl.value = window.Telegram.WebApp.initDataUnsafe.user.photo_url
    }
    
    // Авторизуемся
    const authResponse = await $fetch<{ success: boolean; user: any }>('/api/auth', { method: 'POST' })
    
    if (authResponse.success && authResponse.user) {
      authStore.setUser(authResponse.user)
    }
    
    await Promise.all([
      fetchReminders(),
      fetchGamification(),
      fetchActivity('week')
    ])
  } catch (err: any) {
    console.error('[Dashboard] Ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

const handleCompleteReminder = async (reminderId: number) => {
  try {
    isCompletingReminder.value = true
    await completeReminder(reminderId)
    await fetchGamification()
    showSuccess('Выполнено!', '✅')
  } catch (err: any) {
    showError(err.data?.statusMessage || 'Ошибка', '❌')
  } finally {
    isCompletingReminder.value = false
  }
}

const getCategoryLabel = (category?: string): string => {
  const labels: Record<string, string> = {
    family: 'Семья',
    friends: 'Друзья',
    colleagues: 'Коллеги',
    business: 'Бизнес'
  }
  return labels[category || ''] || 'Другое'
}

const getCategoryIcon = (category?: string): string => {
  const icons: Record<string, string> = {
    family: '👨‍👩‍👧',
    friends: '👥',
    colleagues: '💼',
    business: '🤝'
  }
  return icons[category || ''] || '👤'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-active {
  position: absolute;
  width: calc(100% - 2rem);
}
</style>
