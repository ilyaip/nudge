<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click.self="handleClose"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Заголовок -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">Добавить контакт</h2>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      <!-- Контент -->
      <div class="p-6 space-y-4">
        <!-- Информация об импорте -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800 font-medium mb-2">💡 Как импортировать контакты:</p>
          <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Нажмите "Импортировать из Telegram"</li>
            <li>Откроется чат с ботом</li>
            <li>Нажмите 📎 (скрепка) → Контакт</li>
            <li>Выберите контакты и отправьте боту</li>
            <li>Вернитесь в приложение - контакты добавлены!</li>
          </ol>
        </div>

        <!-- Кнопка импорта из Telegram -->
        <button
          @click="handleImportFromTelegram"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span class="text-xl">📱</span>
          <span>Импортировать из Telegram</span>
        </button>

        <!-- Разделитель -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">или добавьте вручную</span>
          </div>
        </div>

        <!-- Форма ручного ввода -->
        <div class="space-y-4">
          <!-- Имя (обязательное) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Имя <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Иван Иванов"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              :class="{ 'border-red-500': errors.name }"
            />
            <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
          </div>

          <!-- Username (необязательное) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Username в Telegram
            </label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-gray-400">@</span>
              <input
                v-model="formData.username"
                type="text"
                placeholder="username"
                class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Категория -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Категория <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.category"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="friends">👥 Друзья</option>
              <option value="family">👨‍👩‍👧 Семья</option>
              <option value="colleagues">💼 Коллеги</option>
              <option value="business">🤝 Бизнес</option>
            </select>
          </div>

          <!-- Отслеживать контакт -->
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <input
              v-model="formData.isTracked"
              type="checkbox"
              id="isTracked"
              class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label for="isTracked" class="text-sm font-medium text-gray-700 cursor-pointer">
              Отслеживать этот контакт
            </label>
          </div>

          <!-- Настройки отслеживания (показываются только если включено) -->
          <div v-if="formData.isTracked" class="space-y-4 pl-4 border-l-2 border-blue-200">
            <!-- Частота -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Частота связи
              </label>
              <select
                v-model="formData.frequency"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="custom">Своя частота</option>
              </select>
            </div>

            <!-- Кастомная частота (если выбрано "custom") -->
            <div v-if="formData.frequency === 'custom'">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Количество дней
              </label>
              <input
                v-model.number="formData.customFrequencyDays"
                type="number"
                min="1"
                placeholder="14"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Тип коммуникации -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Тип коммуникации
              </label>
              <select
                v-model="formData.communicationType"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="message">💬 Сообщение</option>
                <option value="call">📞 Звонок</option>
                <option value="meeting">🤝 Встреча</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Футер с кнопками -->
      <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
        <button
          @click="handleClose"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Отмена
        </button>
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LoadingSpinner v-if="isSubmitting" size="small" color="white" />
          <span>{{ isSubmitting ? 'Добавление...' : 'Добавить' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { CreateContactData } from '~/composables/useContacts'

// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  submit: [data: CreateContactData]
}>()

// Локальное состояние
const mode = ref<'manual' | 'telegram'>('manual')
const isSubmitting = ref(false)
const selectedTelegramContact = ref<any>(null)

// Данные формы
const formData = ref<CreateContactData>({
  telegramContactId: '',
  name: '',
  username: '',
  category: 'friends',
  isTracked: false,
  frequency: 'monthly',
  customFrequencyDays: undefined,
  communicationType: 'message'
})

// Ошибки валидации
const errors = ref<Record<string, string>>({})

/**
 * Проверка валидности формы
 */
const isFormValid = computed(() => {
  return formData.value.name.trim().length > 0
})

/**
 * Импортировать контакты из Telegram
 */
const handleImportFromTelegram = () => {
  // Проверяем доступность Telegram Web App API
  if (!window.Telegram?.WebApp) {
    alert('Telegram Web App API недоступен.')
    return
  }

  // Закрываем модальное окно
  handleClose()

  // Открываем чат с ботом с инструкцией
  const botUsername = 'NudgeMeNow_bot'
  
  // Используем openLink вместо openTelegramLink
  const telegramApp = window.Telegram.WebApp as any
  if (telegramApp.openTelegramLink) {
    telegramApp.openTelegramLink(`https://t.me/${botUsername}?start=import`)
  } else if (telegramApp.openLink) {
    telegramApp.openLink(`https://t.me/${botUsername}?start=import`)
  } else {
    // Fallback - открываем в новом окне
    window.open(`https://t.me/${botUsername}?start=import`, '_blank')
  }
}

/**
 * Выбрать контакт из Telegram
 */
const handleSelectFromTelegram = () => {
  mode.value = 'telegram'
  
  // Проверяем доступность Telegram Web App API
  if (!window.Telegram?.WebApp) {
    alert('Telegram Web App API недоступен. Используйте ручной ввод.')
    mode.value = 'manual'
    return
  }

  // Показываем инструкцию пользователю
  alert('Для добавления контакта из Telegram:\n\n1. Нажмите кнопку "Поделиться контактом" в Telegram\n2. Выберите контакт\n3. Отправьте его боту @NudgeMeNow_bot\n\nПока используйте ручной ввод.')
  mode.value = 'manual'
}

/**
 * Валидация формы
 */
const validateForm = (): boolean => {
  errors.value = {}

  if (mode.value === 'manual') {
    if (!formData.value.name.trim()) {
      errors.value.name = 'Имя обязательно'
      return false
    }
  }

  if (formData.value.frequency === 'custom' && (!formData.value.customFrequencyDays || formData.value.customFrequencyDays <= 0)) {
    errors.value.customFrequencyDays = 'Укажите количество дней'
    return false
  }

  return true
}

/**
 * Отправить форму
 */
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Подготовка данных для отправки
    const submitData: CreateContactData = {
      ...formData.value,
      // Для ручного ввода генерируем временный ID
      telegramContactId: formData.value.telegramContactId || `manual_${Date.now()}`
    }

    // Убираем customFrequencyDays если не custom
    if (submitData.frequency !== 'custom') {
      submitData.customFrequencyDays = undefined
    }

    emit('submit', submitData)
  } catch (error) {
    console.error('[AddContactModal] Submit error:', error)
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Закрыть модальное окно
 */
const handleClose = () => {
  emit('close')
}

/**
 * Сбросить форму при закрытии
 */
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    // Сбрасываем форму
    mode.value = 'manual'
    selectedTelegramContact.value = null
    formData.value = {
      telegramContactId: '',
      name: '',
      username: '',
      category: 'friends',
      isTracked: false,
      frequency: 'monthly',
      customFrequencyDays: undefined,
      communicationType: 'message'
    }
    errors.value = {}
  }
})
</script>
