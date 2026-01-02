<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
        @click.self="handleClose"
      >
        <Transition name="modal-content" appear>
          <div 
            v-if="isOpen"
            class="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
          >
      <!-- Заголовок -->
      <div class="sticky top-0 bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 class="text-xl font-bold text-text">Добавить контакт</h2>
        <button
          @click="handleClose"
          class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg class="w-5 h-5 text-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Контент -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Информация об импорте -->
        <div class="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p class="text-sm text-primary font-semibold mb-2">💡 Как импортировать:</p>
          <ol class="text-sm text-textSecondary space-y-1 list-decimal list-inside">
            <li>Нажмите "Импортировать"</li>
            <li>Откроется чат с ботом</li>
            <li>📎 → Контакт</li>
            <li>Выберите и отправьте</li>
          </ol>
        </div>

        <!-- Кнопка импорта из Telegram -->
        <button
          @click="handleImportFromTelegram"
          class="w-full gradient-purple-bright hover:opacity-90 text-white px-4 py-3.5 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <span class="text-lg">📱</span>
          <span>Импортировать из Telegram</span>
        </button>

        <!-- Разделитель -->
        <div class="relative py-2">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="px-3 bg-white text-sm text-textSecondary">или вручную</span>
          </div>
        </div>

        <!-- Форма ручного ввода -->
        <div class="space-y-4">
          <!-- Имя -->
          <div>
            <label class="block text-sm font-semibold text-text mb-1.5">
              Имя <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Иван Иванов"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white"
              :class="{ 'border-red-400 focus:ring-red-400': errors.name }"
            />
            <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-text mb-1.5">
              Username в Telegram
            </label>
            <div class="relative">
              <span class="absolute left-4 top-3 text-textSecondary">@</span>
              <input
                v-model="formData.username"
                type="text"
                placeholder="username"
                class="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white"
              />
            </div>
          </div>

          <!-- Категория -->
          <div>
            <label class="block text-sm font-semibold text-text mb-1.5">
              Категория <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.category"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white appearance-none"
            >
              <option value="friends">👥 Друзья</option>
              <option value="family">👨‍👩‍👧 Семья</option>
              <option value="colleagues">💼 Коллеги</option>
              <option value="business">🤝 Бизнес</option>
            </select>
          </div>

          <!-- Отслеживать контакт -->
          <div class="flex items-center gap-3 p-4 bg-backgroundSecondary rounded-2xl">
            <input
              v-model="formData.isTracked"
              type="checkbox"
              id="isTracked"
              class="w-5 h-5 text-primary rounded-lg border-gray-300 focus:ring-2 focus:ring-primary"
            />
            <label for="isTracked" class="text-sm font-semibold text-text cursor-pointer">
              Отслеживать контакт
            </label>
          </div>

          <!-- Настройки отслеживания -->
          <div v-if="formData.isTracked" class="space-y-4 p-4 bg-primary/5 rounded-2xl">
            <!-- Частота -->
            <div>
              <label class="block text-sm font-semibold text-text mb-1.5">
                Частота связи
              </label>
              <select
                v-model="formData.frequency"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white appearance-none"
              >
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
                <option value="custom">Своя частота</option>
              </select>
            </div>

            <!-- Кастомная частота -->
            <div v-if="formData.frequency === 'custom'">
              <label class="block text-sm font-semibold text-text mb-1.5">
                Количество дней
              </label>
              <input
                v-model.number="formData.customFrequencyDays"
                type="number"
                min="1"
                placeholder="14"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white"
              />
            </div>

            <!-- Тип коммуникации -->
            <div>
              <label class="block text-sm font-semibold text-text mb-1.5">
                Тип коммуникации
              </label>
              <select
                v-model="formData.communicationType"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base bg-white appearance-none"
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
      <div class="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
        <button
          @click="handleClose"
          class="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-text hover:bg-gray-50 transition-all"
        >
          Отмена
        </button>
        <button
          v-ripple
          @click="handleSubmit"
          :disabled="isSubmitting || !isFormValid"
          class="flex-1 px-4 py-3 bg-primary hover:bg-primaryLight disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
        >
          <LoadingSpinner v-if="isSubmitting" size="small" color="white" />
          <span>{{ isSubmitting ? 'Добавление...' : 'Добавить' }}</span>
        </button>
      </div>
      </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
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
input[type="number"] {
  -webkit-appearance: none;
  appearance: none;
}

/* Стили для checkbox */
input[type="checkbox"] {
  -webkit-appearance: none;
  appearance: none;
  background-color: #fff;
  border: 2px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
}

input[type="checkbox"]:checked {
  background-color: #6B3CE9;
  border-color: #6B3CE9;
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}

/* Анимация backdrop */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* Анимация контента модалки */
.modal-content-enter-active,
.modal-content-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-content-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.modal-content-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 640px) {
  .modal-content-enter-from {
    transform: scale(0.95) translateY(20px);
  }
  
  .modal-content-leave-to {
    transform: scale(0.95) translateY(20px);
  }
}
</style>
