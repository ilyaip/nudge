<template>
  <div class="min-h-screen bg-background pb-28 overflow-x-hidden">
    <div class="p-4 max-w-full overflow-hidden">
      <!-- Заголовок -->
      <header class="mb-6">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="w-10 h-10 rounded-full bg-backgroundSecondary flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg class="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-text">Связи</h1>
            <p class="text-textSecondary text-sm mt-0.5">
              Пользователи Nudge в ваших контактах
            </p>
          </div>
        </div>
      </header>

      <!-- Вкладки -->
      <div class="flex gap-2 mb-4">
        <button
          @click="activeTab = 'added-by'"
          :class="[
            'flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            activeTab === 'added-by'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-backgroundSecondary text-text hover:bg-gray-100'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <span>Добавили меня</span>
            <span 
              v-if="addedByCount > 0"
              class="px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === 'added-by' ? 'bg-white/20' : 'bg-primary/10 text-primary'"
            >
              {{ addedByCount }}
            </span>
          </span>
        </button>
        <button
          @click="activeTab = 'mutual'"
          :class="[
            'flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            activeTab === 'mutual'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-backgroundSecondary text-text hover:bg-gray-100'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <span>Взаимные</span>
            <span 
              v-if="mutualCount > 0"
              class="px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === 'mutual' ? 'bg-white/20' : 'bg-primary/10 text-primary'"
            >
              {{ mutualCount }}
            </span>
          </span>
        </button>
      </div>

      <!-- Состояние загрузки -->
      <SkeletonLoader 
        v-if="isLoading" 
        type="card" 
        :count="3" 
      />

      <!-- Ошибка -->
      <ErrorMessage
        v-else-if="error"
        :message="error"
        title="Ошибка загрузки связей"
        type="error"
        retryable
        :on-retry="loadConnections"
      />

      <!-- Контент вкладки "Добавили меня" -->
      <div v-else-if="activeTab === 'added-by'" class="space-y-3">
        <!-- Пустое состояние -->
        <div v-if="addedByConnections.length === 0" class="bg-backgroundSecondary rounded-3xl shadow-sm p-8 text-center">
          <div class="text-6xl mb-4">👋</div>
          <h3 class="text-xl font-bold text-text mb-2">Пока никто не добавил вас</h3>
          <p class="text-textSecondary">
            Когда другие пользователи Nudge добавят вас в контакты, они появятся здесь
          </p>
        </div>

        <!-- Список пользователей -->
        <div 
          v-for="connection in addedByConnections" 
          :key="connection.contactId"
          class="bg-backgroundSecondary rounded-2xl shadow-sm p-4"
        >
          <div class="flex items-center gap-4">
            <!-- Аватар -->
            <div class="relative flex-shrink-0">
              <div class="w-14 h-14 rounded-full gradient-purple-bright flex items-center justify-center text-2xl shadow-sm">
                {{ getInitials(connection) }}
              </div>
              <LinkedBadge 
                :is-mutual="connection.isMutual" 
              />
            </div>

            <!-- Информация -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-text truncate">
                {{ getDisplayName(connection) }}
              </h3>
              <p v-if="connection.username" class="text-sm text-textSecondary truncate">
                @{{ connection.username }}
              </p>
              <p class="text-xs text-textSecondary mt-1">
                Добавил(а) {{ formatDate(connection.addedAt) }}
              </p>
            </div>

            <!-- Кнопка действия -->
            <button
              v-if="!connection.isMutual"
              @click="handleAddBack(connection)"
              :disabled="addingBack === connection.contactId"
              class="px-4 py-2 bg-primary hover:bg-primaryLight disabled:bg-gray-300 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
            >
              <LoadingSpinner v-if="addingBack === connection.contactId" size="small" color="white" />
              <span v-else>+ Добавить</span>
            </button>
            <span 
              v-else 
              class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg flex-shrink-0"
            >
              ✓ Взаимно
            </span>
          </div>
        </div>
      </div>

      <!-- Контент вкладки "Взаимные" -->
      <div v-else-if="activeTab === 'mutual'" class="space-y-3">
        <!-- Пустое состояние -->
        <div v-if="mutualConnections.length === 0" class="bg-backgroundSecondary rounded-3xl shadow-sm p-8 text-center">
          <div class="text-6xl mb-4">🤝</div>
          <h3 class="text-xl font-bold text-text mb-2">Нет взаимных связей</h3>
          <p class="text-textSecondary">
            Взаимные связи появятся, когда вы и другой пользователь добавите друг друга в контакты
          </p>
        </div>

        <!-- Список взаимных связей -->
        <div 
          v-for="connection in mutualConnections" 
          :key="connection.contactId"
          class="bg-backgroundSecondary rounded-2xl shadow-sm p-4"
        >
          <div class="flex items-center gap-4">
            <!-- Аватар -->
            <div class="relative flex-shrink-0">
              <div class="w-14 h-14 rounded-full gradient-purple-bright flex items-center justify-center text-2xl shadow-sm">
                {{ getInitials(connection) }}
              </div>
              <LinkedBadge :is-mutual="true" />
            </div>

            <!-- Информация -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold text-text truncate">
                {{ getDisplayName(connection) }}
              </h3>
              <p v-if="connection.username" class="text-sm text-textSecondary truncate">
                @{{ connection.username }}
              </p>
              <p class="text-xs text-textSecondary mt-1">
                Связь с {{ formatDate(connection.addedAt) }}
              </p>
            </div>

            <!-- Бейдж взаимной связи -->
            <span class="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg flex-shrink-0">
              🤝 Взаимно
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Нижняя навигация -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useConnections, type AddedByConnection, type MutualConnection } from '~/composables/useConnections'
import { useContacts } from '~/composables/useContacts'
import { useNotifications } from '~/composables/useNotifications'

const router = useRouter()

// Composables
const {
  addedByConnections,
  mutualConnections,
  isLoading,
  error,
  addedByCount,
  mutualCount,
  fetchAll,
  getDisplayName,
  invalidateCache
} = useConnections()

const { createContact } = useContacts()
const { showSuccess, showError } = useNotifications()

// Локальное состояние
const activeTab = ref<'added-by' | 'mutual'>('added-by')
const addingBack = ref<number | null>(null)

/**
 * Загрузить связи
 */
const loadConnections = async () => {
  try {
    await fetchAll()
  } catch (err) {
    console.error('Ошибка загрузки связей:', err)
  }
}

/**
 * Вернуться назад
 */
const goBack = () => {
  router.push('/contacts')
}

/**
 * Получить инициалы пользователя
 */
const getInitials = (connection: AddedByConnection | MutualConnection): string => {
  const name = getDisplayName(connection)
  const parts = name.split(' ')
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  
  return name.substring(0, 2).toUpperCase()
}

/**
 * Форматировать дату
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return 'сегодня'
  } else if (diffDays === 1) {
    return 'вчера'
  } else if (diffDays < 7) {
    return `${diffDays} дн. назад`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} нед. назад`
  } else {
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short'
    })
  }
}

/**
 * Добавить пользователя в ответ
 */
const handleAddBack = async (connection: AddedByConnection) => {
  try {
    addingBack.value = connection.contactId
    
    // Создаём контакт с данными пользователя
    await createContact({
      telegramContactId: connection.telegramId,
      name: getDisplayName(connection),
      username: connection.username || undefined,
      category: 'friends',
      isTracked: false,
      frequency: 'monthly',
      communicationType: 'message'
    })
    
    showSuccess(`${getDisplayName(connection)} добавлен в контакты`, 'Контакт добавлен')
    
    // Инвалидируем кэш и перезагружаем данные
    invalidateCache()
    await loadConnections()
  } catch (err: any) {
    console.error('Ошибка добавления контакта:', err)
    showError(
      err.data?.statusMessage || err.message || 'Не удалось добавить контакт',
      'Ошибка'
    )
  } finally {
    addingBack.value = null
  }
}

// Загрузить данные при монтировании
onMounted(() => {
  loadConnections()
})
</script>

<style scoped>
/* Предотвращаем горизонтальный скролл */
.overflow-x-hidden {
  overflow-x: hidden;
}
</style>
