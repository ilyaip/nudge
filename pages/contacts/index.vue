<template>
  <div class="min-h-screen bg-background pb-28 overflow-x-hidden">
    <div class="p-4 max-w-full overflow-hidden">
      <!-- Заголовок -->
      <header class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-text">Контакты</h1>
            <p class="text-textSecondary mt-1">
              {{ contactCount.tracked }} из {{ contactCount.total }} отслеживаются
            </p>
          </div>
          <div class="flex items-center gap-2">
            <!-- Кнопка связей -->
            <NuxtLink
              to="/connections"
              class="w-11 h-11 rounded-xl bg-backgroundSecondary hover:bg-gray-100 flex items-center justify-center transition-all relative"
              title="Связи"
            >
              <svg class="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <!-- Индикатор новых связей -->
              <span 
                v-if="pendingConnectionsCount > 0"
                class="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {{ pendingConnectionsCount > 9 ? '9+' : pendingConnectionsCount }}
              </span>
            </NuxtLink>
            <!-- Кнопка добавления -->
            <button
              v-ripple
              @click="handleAddContact"
              class="bg-primary hover:bg-primaryLight hover:scale-105 text-white px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Добавить</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Состояние загрузки -->
      <SkeletonLoader 
        v-if="isLoading && contacts.length === 0" 
        type="card" 
        :count="5" 
        show-header 
      />

      <!-- Ошибка -->
      <ErrorMessage
        v-else-if="error"
        :message="error"
        title="Ошибка загрузки контактов"
        type="error"
        retryable
        :on-retry="loadContacts"
      />

      <!-- Основной контент -->
      <div v-else class="space-y-4 pb-4">
      <!-- Поиск и фильтры -->
      <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-4 overflow-hidden">
        <div class="space-y-4">
          <!-- Поисковая строка -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск..."
              class="w-full px-4 py-3 pl-11 pr-10 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base box-border"
            />
            <svg class="absolute left-3.5 top-3.5 w-5 h-5 text-textSecondary pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-3.5 text-textSecondary hover:text-text transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Фильтры по категории -->
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <button
              @click="selectedCategory = null"
              :class="[
                'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === null
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              Все ({{ contactCount.total }})
            </button>
            <button
              @click="selectedCategory = 'family'"
              :class="[
                'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === 'family'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              👨‍👩‍👧 Семья ({{ getCategoryCount('family') }})
            </button>
            <button
              @click="selectedCategory = 'friends'"
              :class="[
                'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === 'friends'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              👥 Друзья ({{ getCategoryCount('friends') }})
            </button>
            <button
              @click="selectedCategory = 'colleagues'"
              :class="[
                'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === 'colleagues'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              💼 Коллеги ({{ getCategoryCount('colleagues') }})
            </button>
            <button
              @click="selectedCategory = 'business'"
              :class="[
                'px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === 'business'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              🤝 Бизнес ({{ getCategoryCount('business') }})
            </button>
          </div>

          <!-- Фильтр по статусу отслеживания -->
          <div class="grid grid-cols-3 gap-2">
            <button
              @click="trackingFilter = 'all'"
              :class="[
                'px-2 py-2.5 rounded-xl font-semibold transition-all text-sm text-center',
                trackingFilter === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              Все
            </button>
            <button
              @click="trackingFilter = 'tracked'"
              :class="[
                'px-2 py-2.5 rounded-xl font-semibold transition-all text-sm text-center leading-tight',
                trackingFilter === 'tracked'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              <span class="block">✓</span>
              <span class="block text-xs">Отслеж.</span>
            </button>
            <button
              @click="trackingFilter = 'untracked'"
              :class="[
                'px-2 py-2.5 rounded-xl font-semibold transition-all text-sm text-center leading-tight',
                trackingFilter === 'untracked'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'bg-white text-text hover:bg-gray-50'
              ]"
            >
              <span class="block text-xs">Не</span>
              <span class="block text-xs">отслеж.</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Список контактов -->
      <section>
        <!-- Пустое состояние -->
        <div v-if="filteredContacts.length === 0" class="bg-backgroundSecondary rounded-3xl shadow-sm p-8 text-center">
          <div class="text-6xl mb-4">📱</div>
          <h3 class="text-xl font-bold text-text mb-2">
            {{ searchQuery || selectedCategory || trackingFilter !== 'all' ? 'Контакты не найдены' : 'Нет контактов' }}
          </h3>
          <p class="text-textSecondary mb-4">
            {{ searchQuery || selectedCategory || trackingFilter !== 'all' 
              ? 'Попробуйте изменить фильтры или поисковый запрос' 
              : 'Добавьте первый контакт, чтобы начать отслеживание' 
            }}
          </p>
          <button
            v-if="!searchQuery && !selectedCategory && trackingFilter === 'all'"
            v-ripple
            @click="handleAddContact"
            class="bg-primary hover:bg-primaryLight hover:scale-105 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm"
          >
            Добавить контакт
          </button>
        </div>

        <!-- Карточки контактов -->
        <div v-else class="space-y-3">
          <NuxtLink
            v-for="contact in filteredContacts"
            :key="contact.id"
            :to="`/contacts/${contact.id}`"
            class="block bg-backgroundSecondary rounded-2xl shadow-sm p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <!-- Круглый аватар с иконкой категории и LinkedBadge -->
              <div class="relative flex-shrink-0">
                <div class="w-14 h-14 rounded-full gradient-purple-bright flex items-center justify-center text-2xl shadow-sm">
                  {{ getCategoryIcon(contact.category) }}
                </div>
                <!-- Бейдж связанного пользователя -->
                <LinkedBadge 
                  v-if="contact.linkedUserId" 
                  :is-mutual="contact.isMutual" 
                />
              </div>

              <!-- Информация о контакте -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-base font-bold text-text truncate">{{ contact.name }}</h3>
                  <span
                    v-if="contact.isTracked"
                    class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                  >
                    ✓
                  </span>
                </div>

                <!-- Username и категория - вторичная информация -->
                <div class="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <span v-if="contact.username">@{{ contact.username }}</span>
                  <span v-if="contact.username && contact.category">•</span>
                  <span>{{ getCategoryLabel(contact.category) }}</span>
                </div>

                <!-- Дополнительная информация для отслеживаемых контактов -->
                <div v-if="contact.isTracked" class="flex flex-wrap gap-2 text-xs text-textSecondary">
                  <span>{{ getFrequencyLabel(contact.frequency, contact.customFrequencyDays) }}</span>
                  <span>•</span>
                  <span>{{ getTypeLabel(contact.communicationType) }}</span>
                  <span v-if="contact.lastContactDate">•</span>
                  <span v-if="contact.lastContactDate">{{ formatDate(contact.lastContactDate) }}</span>
                </div>
              </div>

              <!-- Стрелка -->
              <div class="ml-2 text-textSecondary flex-shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
      </div>
    </div>

    <!-- Модальное окно добавления контакта -->
    <AddContactModal
      :is-open="isAddModalOpen"
      @close="isAddModalOpen = false"
      @submit="handleContactSubmit"
    />

    <!-- Нижняя навигация -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContacts } from '~/composables/useContacts'
import { useConnections } from '~/composables/useConnections'

const route = useRoute()

// Composable
const {
  contacts,
  isLoading,
  error,
  contactCount,
  fetchContacts,
  createContact
} = useContacts()

const { pendingCount, fetchAddedBy } = useConnections()

// Количество ожидающих связей для индикатора
const pendingConnectionsCount = computed(() => pendingCount.value)

// Локальное состояние для фильтров
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const trackingFilter = ref<'all' | 'tracked' | 'untracked'>('all')

/**
 * Отфильтрованные контакты на основе поиска и фильтров
 */
const filteredContacts = computed(() => {
  let result = contacts.value

  // Фильтр по поисковому запросу
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      (contact.username && contact.username.toLowerCase().includes(query))
    )
  }

  // Фильтр по категории
  if (selectedCategory.value) {
    result = result.filter(contact => contact.category === selectedCategory.value)
  }

  // Фильтр по статусу отслеживания
  if (trackingFilter.value === 'tracked') {
    result = result.filter(contact => contact.isTracked)
  } else if (trackingFilter.value === 'untracked') {
    result = result.filter(contact => !contact.isTracked)
  }

  return result
})

/**
 * Загрузить контакты
 */
const loadContacts = async () => {
  try {
    await fetchContacts()
  } catch (err) {
    console.error('Ошибка загрузки контактов:', err)
  }
}

/**
 * Обработать добавление контакта
 */
const isAddModalOpen = ref(false)

const handleAddContact = () => {
  isAddModalOpen.value = true
}

/**
 * Обработать отправку формы добавления контакта
 */
const handleContactSubmit = async (contactData: any) => {
  try {
    await createContact(contactData)
    isAddModalOpen.value = false
    
    // Показываем уведомление об успехе
    // TODO: Добавить toast notification
    console.log('Контакт успешно добавлен')
  } catch (err) {
    console.error('Ошибка добавления контакта:', err)
    // Ошибка уже обработана в composable
  }
}

/**
 * Получить количество контактов в категории
 */
const getCategoryCount = (category: string): number => {
  return contacts.value.filter(c => c.category === category).length
}

/**
 * Получить иконку категории
 */
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    family: '👨‍👩‍👧',
    friends: '👥',
    colleagues: '💼',
    business: '🤝'
  }
  return icons[category] || '📱'
}

/**
 * Получить метку категории на русском
 */
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    family: 'Семья',
    friends: 'Друзья',
    colleagues: 'Коллеги',
    business: 'Бизнес'
  }
  return labels[category] || category
}

/**
 * Получить метку частоты на русском
 */
const getFrequencyLabel = (frequency: string, customDays: number | null): string => {
  const labels: Record<string, string> = {
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    quarterly: 'Ежеквартально'
  }
  
  if (frequency === 'custom' && customDays) {
    return `Каждые ${customDays} дн.`
  }
  
  return labels[frequency] || frequency
}

/**
 * Получить метку типа коммуникации на русском
 */
const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    message: 'Сообщение',
    call: 'Звонок',
    meeting: 'Встреча'
  }
  return labels[type] || type
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
    return 'Сегодня'
  } else if (diffDays === 1) {
    return 'Вчера'
  } else if (diffDays < 7) {
    return `${diffDays} дн. назад`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} нед. назад`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} мес. назад`
  } else {
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

// Загрузить контакты при монтировании компонента и слушать события
onMounted(() => {
  loadContacts()
  
  // Загружаем количество ожидающих связей для индикатора
  fetchAddedBy().catch(() => {
    // Игнорируем ошибки - индикатор просто не покажется
  })
  
  // Слушаем событие из нижней навигации
  window.addEventListener('open-add-contact-modal', handleAddContact)
  
  // Проверяем query параметр для открытия модалки
  if (route.query.add === 'true') {
    handleAddContact()
  }
})

onUnmounted(() => {
  window.removeEventListener('open-add-contact-modal', handleAddContact)
})
</script>

<style scoped>
/* Предотвращаем горизонтальный скролл */
input {
  max-width: 100%;
  box-sizing: border-box;
}

/* Убираем стандартные стили для input на iOS */
input[type="text"] {
  -webkit-appearance: none;
  appearance: none;
}
</style>
