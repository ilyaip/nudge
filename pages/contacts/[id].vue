<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <!-- Состояние загрузки -->
    <div v-if="isLoading && !currentContact" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-800">{{ error }}</p>
      <button 
        @click="loadContact" 
        class="mt-2 text-red-600 hover:text-red-800 underline"
      >
        Попробовать снова
      </button>
    </div>

    <!-- Основной контент -->
    <div v-else-if="currentContact" class="space-y-6">
      <!-- Заголовок с кнопкой назад -->
      <header class="flex items-center gap-4">
        <button
          @click="goBack"
          class="text-gray-600 hover:text-gray-900 text-2xl"
        >
          ←
        </button>
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900">{{ currentContact.name }}</h1>
          <p v-if="currentContact.username" class="text-gray-600 mt-1">
            @{{ currentContact.username }}
          </p>
        </div>
        <button
          @click="handleDelete"
          :disabled="isDeleting"
          class="text-red-600 hover:text-red-800 disabled:text-gray-400 text-2xl"
          title="Удалить контакт"
        >
          🗑️
        </button>
      </header>

      <!-- Информация о контакте -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Информация</h2>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-gray-600">Telegram ID:</span>
            <span class="font-medium text-gray-900">{{ currentContact.telegramContactId }}</span>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-gray-600">Категория:</span>
            <span class="font-medium text-gray-900">
              {{ getCategoryIcon(currentContact.category) }} {{ getCategoryLabel(currentContact.category) }}
            </span>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-gray-600">Дата добавления:</span>
            <span class="font-medium text-gray-900">{{ formatDate(currentContact.createdAt) }}</span>
          </div>
          
          <div v-if="currentContact.lastContactDate" class="flex items-center justify-between py-2">
            <span class="text-gray-600">Последний контакт:</span>
            <span class="font-medium text-gray-900">{{ formatDate(currentContact.lastContactDate) }}</span>
          </div>
        </div>
      </section>

      <!-- Форма конфигурации -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Настройки отслеживания</h2>
        
        <form @submit.prevent="handleSave" class="space-y-6">
          <!-- Переключатель отслеживания -->
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label class="text-lg font-medium text-gray-900">Отслеживать контакт</label>
              <p class="text-sm text-gray-600 mt-1">
                Получать напоминания о необходимости связаться
              </p>
            </div>
            <button
              type="button"
              @click="formData.isTracked = !formData.isTracked"
              :class="[
                'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
                formData.isTracked ? 'bg-green-600' : 'bg-gray-300'
              ]"
            >
              <span
                :class="[
                  'inline-block h-6 w-6 transform rounded-full bg-white transition-transform',
                  formData.isTracked ? 'translate-x-7' : 'translate-x-1'
                ]"
              />
            </button>
          </div>

          <!-- Настройки (показываются только если отслеживается) -->
          <div v-if="formData.isTracked" class="space-y-6">
            <!-- Частота -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Частота связи
              </label>
              <select
                v-model="formData.frequency"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="weekly">Еженедельно (каждые 7 дней)</option>
                <option value="monthly">Ежемесячно (каждые 30 дней)</option>
                <option value="quarterly">Ежеквартально (каждые 90 дней)</option>
                <option value="custom">Своя частота</option>
              </select>
            </div>

            <!-- Кастомная частота -->
            <div v-if="formData.frequency === 'custom'">
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Количество дней
              </label>
              <input
                v-model.number="formData.customFrequencyDays"
                type="number"
                min="1"
                max="365"
                placeholder="Введите количество дней"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Тип коммуникации -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Тип коммуникации
              </label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  @click="formData.communicationType = 'message'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.communicationType === 'message'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  💬 Сообщение
                </button>
                <button
                  type="button"
                  @click="formData.communicationType = 'call'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.communicationType === 'call'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  📞 Звонок
                </button>
                <button
                  type="button"
                  @click="formData.communicationType = 'meeting'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.communicationType === 'meeting'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  🤝 Встреча
                </button>
              </div>
            </div>

            <!-- Категория -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Категория
              </label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="formData.category = 'family'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.category === 'family'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  👨‍👩‍👧 Семья
                </button>
                <button
                  type="button"
                  @click="formData.category = 'friends'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.category === 'friends'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  👥 Друзья
                </button>
                <button
                  type="button"
                  @click="formData.category = 'colleagues'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.category === 'colleagues'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  💼 Коллеги
                </button>
                <button
                  type="button"
                  @click="formData.category = 'business'"
                  :class="[
                    'px-4 py-3 rounded-lg font-medium transition-colors',
                    formData.category === 'business'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  ]"
                >
                  🤝 Бизнес
                </button>
              </div>
            </div>

            <!-- Дата последнего контакта -->
            <div>
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Дата последнего контакта
              </label>
              <input
                v-model="formData.lastContactDate"
                type="date"
                :max="today"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">
                Оставьте пустым, если еще не было контакта
              </p>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="isSaving"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {{ isSaving ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
            <button
              type="button"
              @click="resetForm"
              :disabled="isSaving"
              class="px-6 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Отменить
            </button>
          </div>
        </form>
      </section>

      <!-- История взаимодействий (заглушка) -->
      <section class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">История взаимодействий</h2>
        <div class="text-center py-8 bg-gray-50 rounded-lg">
          <div class="text-5xl mb-3">📋</div>
          <p class="text-gray-600">История взаимодействий</p>
          <p class="text-sm text-gray-500 mt-1">Будет реализована в следующих задачах</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContacts, type UpdateContactData } from '~/composables/useContacts'

const router = useRouter()
const route = useRoute()

// Composable
const {
  currentContact,
  isLoading,
  error,
  fetchContact,
  updateContact,
  deleteContact,
  clearCurrentContact,
  clearError
} = useContacts()

// Локальное состояние
const isSaving = ref(false)
const isDeleting = ref(false)

// Данные формы
const formData = ref({
  isTracked: false,
  frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'custom',
  customFrequencyDays: null as number | null,
  communicationType: 'message' as 'message' | 'call' | 'meeting',
  category: 'friends' as 'family' | 'friends' | 'colleagues' | 'business',
  lastContactDate: '' as string
})

// Сегодняшняя дата для ограничения выбора даты
const today = computed(() => {
  const date = new Date()
  return date.toISOString().split('T')[0]
})

/**
 * Загрузить контакт
 */
const loadContact = async () => {
  try {
    const contactId = parseInt(route.params.id as string)
    if (isNaN(contactId)) {
      throw new Error('Неверный ID контакта')
    }
    
    await fetchContact(contactId)
    
    // Заполнить форму данными контакта
    if (currentContact.value) {
      formData.value = {
        isTracked: currentContact.value.isTracked,
        frequency: currentContact.value.frequency,
        customFrequencyDays: currentContact.value.customFrequencyDays,
        communicationType: currentContact.value.communicationType,
        category: currentContact.value.category,
        lastContactDate: currentContact.value.lastContactDate 
          ? new Date(currentContact.value.lastContactDate).toISOString().split('T')[0]
          : ''
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки контакта:', err)
  }
}

/**
 * Сохранить изменения
 */
const handleSave = async () => {
  if (!currentContact.value) return

  try {
    isSaving.value = true
    clearError()

    const updateData: UpdateContactData = {
      isTracked: formData.value.isTracked,
      frequency: formData.value.frequency,
      customFrequencyDays: formData.value.frequency === 'custom' 
        ? (formData.value.customFrequencyDays ?? undefined)
        : undefined,
      communicationType: formData.value.communicationType,
      category: formData.value.category,
      lastContactDate: formData.value.lastContactDate 
        ? new Date(formData.value.lastContactDate) 
        : null
    }

    await updateContact(currentContact.value.id, updateData)
    
    // Показать уведомление об успехе
    alert('Настройки контакта успешно сохранены!')
  } catch (err) {
    console.error('Ошибка сохранения контакта:', err)
    alert('Не удалось сохранить изменения. Попробуйте еще раз.')
  } finally {
    isSaving.value = false
  }
}

/**
 * Сбросить форму к исходным значениям
 */
const resetForm = () => {
  if (currentContact.value) {
    formData.value = {
      isTracked: currentContact.value.isTracked,
      frequency: currentContact.value.frequency,
      customFrequencyDays: currentContact.value.customFrequencyDays,
      communicationType: currentContact.value.communicationType,
      category: currentContact.value.category,
      lastContactDate: currentContact.value.lastContactDate 
        ? new Date(currentContact.value.lastContactDate).toISOString().split('T')[0]
        : ''
    }
  }
}

/**
 * Удалить контакт
 */
const handleDelete = async () => {
  if (!currentContact.value) return

  const confirmed = confirm(`Вы уверены, что хотите удалить контакт "${currentContact.value.name}"?`)
  if (!confirmed) return

  try {
    isDeleting.value = true
    await deleteContact(currentContact.value.id)
    
    // Вернуться на страницу списка контактов
    router.push('/contacts')
  } catch (err) {
    console.error('Ошибка удаления контакта:', err)
    alert('Не удалось удалить контакт. Попробуйте еще раз.')
  } finally {
    isDeleting.value = false
  }
}

/**
 * Вернуться назад
 */
const goBack = () => {
  router.push('/contacts')
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
 * Форматировать дату
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// Загрузить контакт при монтировании компонента
onMounted(() => {
  loadContact()
})

// Очистить текущий контакт при размонтировании
onUnmounted(() => {
  clearCurrentContact()
})
</script>
