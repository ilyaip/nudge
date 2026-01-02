<template>
  <div class="min-h-screen bg-gray-50 p-4 pb-20">
    <!-- Заголовок -->
    <header class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Контакты</h1>
          <p class="text-gray-600 mt-1">
            {{ contactCount.tracked }} из {{ contactCount.total }} отслеживаются
          </p>
        </div>
        <button
          @click="handleAddContact"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Добавить</span>
        </button>
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
    <div v-else class="space-y-4">
      <!-- Поиск и фильтры -->
      <section class="bg-white rounded-lg shadow-md p-4">
        <div class="space-y-4">
          <!-- Поисковая строка -->
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск по имени или username..."
              class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span class="absolute left-3 top-3.5 text-gray-400 text-xl">🔍</span>
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <!-- Фильтры по категории -->
          <div class="flex gap-2 overflow-x-auto pb-2">
            <button
              @click="selectedCategory = null"
              :class="[
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                selectedCategory === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              Все ({{ contactCount.total }})
            </button>
            <button
              @click="selectedCategory = 'family'"
              :class="[
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                selectedCategory === 'family'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              👨‍👩‍👧 Семья ({{ getCategoryCount('family') }})
            </button>
            <button
              @click="selectedCategory = 'friends'"
              :class="[
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                selectedCategory === 'friends'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              👥 Друзья ({{ getCategoryCount('friends') }})
            </button>
            <button
              @click="selectedCategory = 'colleagues'"
              :class="[
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                selectedCategory === 'colleagues'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              💼 Коллеги ({{ getCategoryCount('colleagues') }})
            </button>
            <button
              @click="selectedCategory = 'business'"
              :class="[
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
                selectedCategory === 'business'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              🤝 Бизнес ({{ getCategoryCount('business') }})
            </button>
          </div>

          <!-- Фильтр по статусу отслеживания -->
          <div class="flex gap-2">
            <button
              @click="trackingFilter = 'all'"
              :class="[
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                trackingFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              Все
            </button>
            <button
              @click="trackingFilter = 'tracked'"
              :class="[
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                trackingFilter === 'tracked'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              ✓ Отслеживаются
            </button>
            <button
              @click="trackingFilter = 'untracked'"
              :class="[
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                trackingFilter === 'untracked'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              Не отслеживаются
            </button>
          </div>
        </div>
      </section>

      <!-- Список контактов -->
      <section>
        <!-- Пустое состояние -->
        <div v-if="filteredContacts.length === 0" class="bg-white rounded-lg shadow-md p-8 text-center">
          <div class="text-6xl mb-4">📱</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">
            {{ searchQuery || selectedCategory || trackingFilter !== 'all' ? 'Контакты не найдены' : 'Нет контактов' }}
          </h3>
          <p class="text-gray-600 mb-4">
            {{ searchQuery || selectedCategory || trackingFilter !== 'all' 
              ? 'Попробуйте изменить фильтры или поисковый запрос' 
              : 'Добавьте первый контакт, чтобы начать отслеживание' 
            }}
          </p>
          <button
            v-if="!searchQuery && !selectedCategory && trackingFilter === 'all'"
            @click="handleAddContact"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Добавить контакт
          </button>
        </div>

        <!-- Карточки контактов -->
        <div v-else class="space-y-3">
          <div
            v-for="contact in filteredContacts"
            :key="contact.id"
            @click="navigateToContact(contact.id)"
            class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="flex items-start justify-between">
              <!-- Информация о контакте -->
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h3 class="text-lg font-semibold text-gray-900">{{ contact.name }}</h3>
                  <span
                    v-if="contact.isTracked"
                    class="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded"
                  >
                    ✓ Отслеживается
                  </span>
                </div>

                <p v-if="contact.username" class="text-sm text-gray-600 mb-2">
                  @{{ contact.username }}
                </p>

                <div class="flex flex-wrap gap-2">
                  <!-- Категория -->
                  <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                    <span>{{ getCategoryIcon(contact.category) }}</span>
                    <span>{{ getCategoryLabel(contact.category) }}</span>
                  </span>

                  <!-- Частота (только для отслеживаемых) -->
                  <span
                    v-if="contact.isTracked"
                    class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                  >
                    {{ getFrequencyLabel(contact.frequency, contact.customFrequencyDays) }}
                  </span>

                  <!-- Тип коммуникации (только для отслеживаемых) -->
                  <span
                    v-if="contact.isTracked"
                    class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                  >
                    {{ getTypeLabel(contact.communicationType) }}
                  </span>
                </div>

                <!-- Дата последнего контакта -->
                <p v-if="contact.lastContactDate" class="text-xs text-gray-500 mt-2">
                  Последний контакт: {{ formatDate(contact.lastContactDate) }}
                </p>
              </div>

              <!-- Стрелка -->
              <div class="ml-4 text-gray-400 text-xl">
                →
              </div>
            </div>
          </div>
        </div>
      </section>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContacts, type Contact } from '~/composables/useContacts'

const router = useRouter()

// Composable
const {
  contacts,
  isLoading,
  error,
  contactCount,
  fetchContacts,
  createContact,
  clearError
} = useContacts()

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
 * Перейти на страницу деталей контакта
 */
const navigateToContact = (contactId: number) => {
  router.push(`/contacts/${contactId}`)
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

// Загрузить контакты при монтировании компонента
onMounted(() => {
  loadContacts()
})
</script>
