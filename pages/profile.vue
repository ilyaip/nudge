<template>
  <div class="min-h-screen bg-background pb-28">
    <!-- Header с градиентом -->
    <header class="gradient-purple-header p-6 pb-24 rounded-b-[32px] relative">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Профиль</h1>
        <button 
          @click="handleSettings"
          class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Аватар (выступает над header) -->
    <div class="flex justify-center -mt-16 mb-4 relative z-10">
      <div class="relative">
        <div 
          class="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-backgroundSecondary flex items-center justify-center"
          @click="triggerAvatarUpload"
        >
          <img 
            v-if="avatarUrl" 
            :src="avatarUrl" 
            alt="Аватар" 
            class="w-full h-full object-cover"
          />
          <span v-else class="text-5xl">{{ userInitials }}</span>
        </div>
        
        <!-- Кнопка редактирования аватара -->
        <button 
          @click="triggerAvatarUpload"
          class="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center border-2 border-white"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        
        <!-- Скрытый input для загрузки файла -->
        <input 
          ref="avatarInput"
          type="file" 
          accept="image/*" 
          class="hidden"
          @change="handleAvatarChange"
        />
      </div>
    </div>

    <!-- Имя пользователя -->
    <div class="text-center mb-6 px-4">
      <h2 class="text-2xl font-bold text-text">{{ userName }}</h2>
      <p v-if="userUsername" class="text-textSecondary">@{{ userUsername }}</p>
    </div>

    <!-- Основной контент -->
    <div class="px-4 space-y-4">
      <!-- Статистика -->
      <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-6">
        <h3 class="text-lg font-bold text-text mb-4">Статистика</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-primary">{{ stats.totalContacts }}</p>
            <p class="text-xs text-textSecondary mt-1">Контактов</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-primary">{{ stats.completedReminders }}</p>
            <p class="text-xs text-textSecondary mt-1">Выполнено</p>
          </div>
          <div class="text-center">
            <p class="text-3xl font-bold text-primary">{{ stats.currentStreak }}</p>
            <p class="text-xs text-textSecondary mt-1">Дней подряд</p>
          </div>
        </div>
      </section>

      <!-- Информация о пользователе -->
      <section class="bg-backgroundSecondary rounded-3xl shadow-sm overflow-hidden">
        <h3 class="text-lg font-bold text-text p-6 pb-4">Информация</h3>
        
        <div class="divide-y divide-gray-100">
          <!-- Имя -->
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-textSecondary">Имя</p>
                <p class="font-semibold text-text">{{ userName }}</p>
              </div>
            </div>
          </div>

          <!-- Username -->
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-textSecondary">Username</p>
                <p class="font-semibold text-text">{{ userUsername ? '@' + userUsername : 'Не указан' }}</p>
              </div>
            </div>
          </div>

          <!-- Уровень -->
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-textSecondary">Уровень</p>
                <p class="font-semibold text-text">{{ stats.level }} ({{ stats.totalXP }} XP)</p>
              </div>
            </div>
          </div>

          <!-- Дата регистрации -->
          <div class="flex items-center justify-between px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-textSecondary">С нами с</p>
                <p class="font-semibold text-text">{{ formatDate(stats.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Настройки уведомлений -->
      <section data-section="notifications" class="bg-backgroundSecondary rounded-3xl shadow-sm p-6">
        <NotificationSettings />
      </section>

      <!-- Действия -->
      <section class="bg-backgroundSecondary rounded-3xl shadow-sm overflow-hidden">
        <button 
          @click="handleExportData"
          class="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <span class="font-semibold text-text">Экспорт данных</span>
        </button>
      </section>
    </div>

    <!-- Нижняя навигация -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useGamification } from '~/composables/useGamification'
import { useContacts } from '~/composables/useContacts'
import { useNotifications } from '~/composables/useNotifications'

const authStore = useAuthStore()
const { showSuccess, showError } = useNotifications()
const { currentStreak, totalXP, level, fetchAll: fetchGamification } = useGamification()
const { contactCount, fetchContacts } = useContacts()

// Refs
const avatarInput = ref<HTMLInputElement | null>(null)
const avatarUrl = ref<string | null>(null)
const isLoading = ref(false)

// Computed
const userName = computed(() => {
  return authStore.user?.firstName 
    ? `${authStore.user.firstName}${authStore.user.lastName ? ' ' + authStore.user.lastName : ''}`
    : 'Пользователь'
})

const userUsername = computed(() => authStore.user?.username || '')

const userInitials = computed(() => {
  const name = userName.value
  if (!name || name === 'Пользователь') return '👤'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.substring(0, 2).toUpperCase()
})

const stats = computed(() => ({
  totalContacts: contactCount.value.total,
  completedReminders: 0, // TODO: добавить в API
  currentStreak: currentStreak.value,
  level: level.value,
  totalXP: totalXP.value,
  createdAt: new Date().toISOString() // TODO: добавить в API
}))

// Methods
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  // Проверка размера (макс 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError('Файл слишком большой. Максимум 5MB', 'Ошибка')
    return
  }
  
  // Проверка типа
  if (!file.type.startsWith('image/')) {
    showError('Выберите изображение', 'Ошибка')
    return
  }
  
  try {
    // Создаем превью
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarUrl.value = e.target?.result as string
      // Сохраняем в localStorage для персистентности
      localStorage.setItem('userAvatar', avatarUrl.value)
      showSuccess('Аватар обновлен', '✨')
    }
    reader.readAsDataURL(file)
  } catch (error) {
    console.error('Error uploading avatar:', error)
    showError('Не удалось загрузить аватар', 'Ошибка')
  }
}

const handleSettings = () => {
  // Прокрутить к секции настроек уведомлений
  const notificationSection = document.querySelector('[data-section="notifications"]')
  if (notificationSection) {
    notificationSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleExportData = () => {
  // TODO: Экспорт данных
  showSuccess('Экспорт данных скоро будет доступен', '📦')
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Lifecycle
onMounted(async () => {
  // Загружаем сохраненный аватар
  const savedAvatar = localStorage.getItem('userAvatar')
  if (savedAvatar) {
    avatarUrl.value = savedAvatar
  }
  
  // Загружаем данные
  await Promise.all([
    fetchGamification(),
    fetchContacts()
  ])
})
</script>

<style scoped>
/* Убираем стандартные стили для input file */
input[type="file"] {
  display: none;
}
</style>
