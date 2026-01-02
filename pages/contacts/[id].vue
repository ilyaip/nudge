<template>
  <div :key="String(route.params.id)" class="min-h-screen bg-background p-4 pb-28 overflow-x-hidden">
    <!-- Состояние загрузки -->
    <SkeletonLoader 
      v-if="isLoading && !currentContact" 
      type="card" 
      :count="3" 
      show-header 
    />

    <!-- Ошибка -->
    <ErrorMessage
      v-else-if="error"
      :message="error"
      title="Ошибка загрузки контакта"
      type="error"
      retryable
      :on-retry="loadContact"
    />

    <!-- Основной контент -->
    <div v-else-if="currentContact" class="space-y-4">
      <!-- Заголовок с кнопкой назад -->
      <header class="flex items-center gap-3">
        <button
          @click="goBack"
          class="w-10 h-10 rounded-full bg-backgroundSecondary flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          <svg class="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <!-- Аватар -->
        <div class="w-14 h-14 rounded-full gradient-purple-bright flex items-center justify-center text-2xl flex-shrink-0">
          {{ getCategoryIcon(currentContact.category) }}
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl font-bold text-text truncate">{{ currentContact.name }}</h1>
          <p v-if="currentContact.username" class="text-sm text-textSecondary truncate">
            @{{ currentContact.username }}
          </p>
        </div>
        <button
          @click="handleDelete"
          :disabled="isDeleting"
          class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
          title="Удалить контакт"
        >
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </header>

      <!-- Информация о контакте -->
      <section class="bg-backgroundSecondary rounded-2xl shadow-sm p-4">
        <h2 class="text-base font-bold text-text mb-3">Информация</h2>
        
        <div class="space-y-2">
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-textSecondary">Категория</span>
            <span class="text-sm font-medium text-text">
              {{ getCategoryIcon(currentContact.category) }} {{ getCategoryLabel(currentContact.category) }}
            </span>
          </div>
          
          <div class="flex items-center justify-between py-2 border-b border-gray-100">
            <span class="text-sm text-textSecondary">Добавлен</span>
            <span class="text-sm font-medium text-text">{{ formatDate(currentContact.createdAt) }}</span>
          </div>
          
          <div v-if="currentContact.lastContactDate" class="flex items-center justify-between py-2">
            <span class="text-sm text-textSecondary">Последний контакт</span>
            <span class="text-sm font-medium text-text">{{ formatDate(currentContact.lastContactDate) }}</span>
          </div>
        </div>
      </section>

      <!-- Форма конфигурации -->
      <section class="bg-backgroundSecondary rounded-2xl shadow-sm p-4">
        <h2 class="text-base font-bold text-text mb-3">Настройки</h2>
        
        <form @submit.prevent="handleSave" class="space-y-4">
          <!-- Переключатель отслеживания -->
          <div class="flex items-center justify-between p-4 bg-white rounded-xl">
            <div class="flex-1 min-w-0 pr-4">
              <p class="text-sm font-semibold text-text">Отслеживать контакт</p>
              <p class="text-xs text-textSecondary mt-0.5">Получать напоминания</p>
            </div>
            <button
              type="button"
              @click="formData.isTracked = !formData.isTracked"
              :class="[
                'relative inline-flex items-center w-11 h-6 rounded-full transition-colors flex-shrink-0 p-0.5',
                formData.isTracked ? 'bg-primary' : 'bg-gray-300'
              ]"
            >
              <span
                :class="[
                  'inline-block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200',
                  formData.isTracked ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>

          <!-- Настройки (показываются только если отслеживается) -->
          <div v-if="formData.isTracked" class="space-y-4">
            <!-- Частота -->
            <div>
              <label class="block text-sm font-semibold text-text mb-2">Частота связи</label>
              <select
                v-model="formData.frequency"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-base bg-white appearance-none"
              >
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="custom">Своя частота</option>
              </select>
            </div>

            <!-- Кастомная частота -->
            <div v-if="formData.frequency === 'custom'">
              <label class="block text-sm font-semibold text-text mb-2">Количество дней</label>
              <input
                v-model.number="formData.customFrequencyDays"
                type="number"
                min="1"
                max="365"
                placeholder="14"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-base bg-white"
              />
            </div>

            <!-- Тип коммуникации -->
            <div>
              <label class="block text-sm font-semibold text-text mb-2">Тип коммуникации</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="formData.communicationType = 'message'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.communicationType === 'message'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  💬 Сообщение
                </button>
                <button
                  type="button"
                  @click="formData.communicationType = 'call'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.communicationType === 'call'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  📞 Звонок
                </button>
                <button
                  type="button"
                  @click="formData.communicationType = 'meeting'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.communicationType === 'meeting'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  🤝 Встреча
                </button>
              </div>
            </div>

            <!-- Категория -->
            <div>
              <label class="block text-sm font-semibold text-text mb-2">Категория</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="formData.category = 'family'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.category === 'family'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  👨‍👩‍👧 Семья
                </button>
                <button
                  type="button"
                  @click="formData.category = 'friends'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.category === 'friends'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  👥 Друзья
                </button>
                <button
                  type="button"
                  @click="formData.category = 'colleagues'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.category === 'colleagues'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  💼 Коллеги
                </button>
                <button
                  type="button"
                  @click="formData.category = 'business'"
                  :class="[
                    'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    formData.category === 'business'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text border border-gray-200'
                  ]"
                >
                  🤝 Бизнес
                </button>
              </div>
            </div>

            <!-- Дата последнего контакта -->
            <div>
              <label class="block text-sm font-semibold text-text mb-2">Последний контакт</label>
              <input
                v-model="formData.lastContactDate"
                type="date"
                :max="today"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-base bg-white box-border"
              />
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="resetForm"
              :disabled="isSaving"
              class="flex-1 px-4 py-3 bg-white border border-gray-200 text-text rounded-xl font-semibold transition-all"
            >
              Отмена
            </button>
            <button
              v-ripple
              type="submit"
              :disabled="isSaving"
              class="flex-1 bg-primary hover:bg-primaryLight disabled:bg-gray-300 text-white px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <LoadingSpinner v-if="isSaving" size="small" color="white" />
              <span>{{ isSaving ? 'Сохранение...' : 'Сохранить' }}</span>
            </button>
          </div>
        </form>
      </section>
    </div>

    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useContacts, type UpdateContactData } from '~/composables/useContacts'
import { useNotifications } from '~/composables/useNotifications'

const router = useRouter()
const route = useRoute()

// Composables
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

const { showSuccess, showError } = useNotifications()

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
    
    console.log('[Contact Detail] Loading contact:', contactId)
    
    if (isNaN(contactId)) {
      console.error('[Contact Detail] Invalid contact ID')
      throw new Error('Неверный ID контакта')
    }
    
    await fetchContact(contactId)
    
    console.log('[Contact Detail] Contact loaded:', currentContact.value)
    
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
    } else {
      console.error('[Contact Detail] Contact not found after fetch')
    }
  } catch (err: any) {
    console.error('[Contact Detail] Error loading contact:', err)
    console.error('[Contact Detail] Error details:', err.data || err.message)
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
        ? new Date(formData.value.lastContactDate).toISOString() 
        : null
    }

    await updateContact(currentContact.value.id, updateData)
    
    // Показать уведомление об успехе
    showSuccess('Настройки контакта успешно сохранены', 'Сохранено')
  } catch (err: any) {
    console.error('Ошибка сохранения контакта:', err)
    showError(
      err.data?.statusMessage || err.message || 'Не удалось сохранить изменения. Попробуйте еще раз.',
      'Ошибка сохранения'
    )
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
    
    // Показать уведомление об успехе
    showSuccess('Контакт успешно удален', 'Удалено')
    
    // Вернуться на страницу списка контактов
    router.push('/contacts')
  } catch (err: any) {
    console.error('Ошибка удаления контакта:', err)
    showError(
      err.data?.statusMessage || err.message || 'Не удалось удалить контакт. Попробуйте еще раз.',
      'Ошибка удаления'
    )
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
  console.log('[Contact Detail] Component mounted')
  loadContact()
})

// Следить за изменением ID в URL
watch(() => route.params.id, (newId, oldId) => {
  console.log('[Contact Detail] Route ID changed:', oldId, '->', newId)
  if (newId) {
    loadContact()
  }
}, { immediate: false })

// Очистить текущий контакт при размонтировании
onUnmounted(() => {
  clearCurrentContact()
})
</script>

<style scoped>
/* Стили для select с кастомной стрелкой */
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem;
}

/* Убираем стандартные стили для input на iOS */
input[type="text"],
input[type="number"],
input[type="date"] {
  -webkit-appearance: none;
  appearance: none;
}

/* Фикс для date input на iOS */
input[type="date"] {
  min-height: 48px;
}
</style>
