<template>
  <form @submit.prevent="handleSubmit" class="space-y-5 max-w-full overflow-hidden">
    <!-- Название события -->
    <div class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Название события *
      </label>
      <input
        v-model="form.title"
        type="text"
        placeholder="Например: Встреча с командой"
        class="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base box-border"
        :class="{ 'border-red-300': errors.title }"
        required
      />
      <p v-if="errors.title" class="text-red-500 text-xs mt-1">{{ errors.title }}</p>
    </div>

    <!-- Тип события -->
    <div class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Тип события *
      </label>
      <div class="grid grid-cols-4 gap-1.5">
        <button
          v-for="eventType in eventTypes"
          :key="eventType.value"
          type="button"
          @click="form.type = eventType.value"
          class="flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-w-0"
          :class="form.type === eventType.value 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-200 hover:border-gray-300'"
        >
          <span class="text-xl">{{ eventType.icon }}</span>
          <span class="text-[10px] font-medium text-text truncate w-full text-center">{{ eventType.label }}</span>
        </button>
      </div>
    </div>

    <!-- Кастомный тип (если выбрано "Другое") -->
    <div v-if="form.type === 'other'" class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Укажите тип *
      </label>
      <input
        v-model="form.customType"
        type="text"
        placeholder="Например: Вебинар"
        class="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base box-border"
        :class="{ 'border-red-300': errors.customType }"
      />
      <p v-if="errors.customType" class="text-red-500 text-xs mt-1">{{ errors.customType }}</p>
    </div>

    <!-- Описание -->
    <div class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Описание
      </label>
      <textarea
        v-model="form.description"
        placeholder="Добавьте описание события..."
        rows="3"
        class="w-full px-3 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-base box-border"
      />
    </div>

    <!-- Дата и время -->
    <div class="flex flex-col gap-3 min-w-0">
      <div class="flex gap-3 min-w-0">
        <div class="flex-1 min-w-0">
          <label class="block text-sm font-semibold text-text mb-2">
            Дата *
          </label>
          <input
            v-model="form.date"
            type="date"
            :min="minDate"
            class="w-full px-2 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm box-border"
            :class="{ 'border-red-300': errors.date }"
            required
          />
        </div>
        <div class="flex-1 min-w-0">
          <label class="block text-sm font-semibold text-text mb-2">
            Время *
          </label>
          <input
            v-model="form.time"
            type="time"
            class="w-full px-2 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm box-border"
            :class="{ 'border-red-300': errors.time }"
            required
          />
        </div>
      </div>
      <p v-if="errors.date" class="text-red-500 text-xs -mt-2">{{ errors.date }}</p>
      <p v-if="errors.time" class="text-red-500 text-xs -mt-2">{{ errors.time }}</p>
    </div>

    <!-- Продолжительность -->
    <div class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Продолжительность *
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="duration in durations"
          :key="duration.value"
          type="button"
          @click="form.duration = duration.value"
          class="px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all whitespace-nowrap"
          :class="form.duration === duration.value 
            ? 'border-primary bg-primary/5 text-primary' 
            : 'border-gray-200 text-text hover:border-gray-300'"
        >
          {{ duration.label }}
        </button>
      </div>
      <!-- Кастомная продолжительность -->
      <div v-if="showCustomDuration" class="mt-3 flex items-center gap-2">
        <input
          v-model.number="customDurationMinutes"
          type="number"
          min="15"
          max="1440"
          placeholder="Минуты"
          class="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
        />
        <span class="text-sm text-textSecondary">минут</span>
      </div>
    </div>

    <!-- Повторение -->
    <div class="min-w-0">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-semibold text-text">
          Повторение
        </label>
        <button
          type="button"
          @click="form.isRecurring = !form.isRecurring"
          class="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
          :class="form.isRecurring ? 'bg-primary' : 'bg-gray-300'"
        >
          <span 
            class="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
            :class="form.isRecurring ? 'left-7' : 'left-1'"
          />
        </button>
      </div>
      
      <!-- Опции повторения -->
      <div v-if="form.isRecurring" class="space-y-3 mt-3 p-3 bg-gray-50 rounded-xl">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="pattern in recurrencePatterns"
            :key="pattern.value"
            type="button"
            @click="form.recurrencePattern = pattern.value"
            class="px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all whitespace-nowrap"
            :class="form.recurrencePattern === pattern.value 
              ? 'border-primary bg-primary/5 text-primary' 
              : 'border-gray-200 text-text hover:border-gray-300'"
          >
            {{ pattern.label }}
          </button>
        </div>
        
        <!-- Кастомный интервал -->
        <div v-if="form.recurrencePattern === 'custom'" class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-textSecondary">Каждые</span>
          <input
            v-model.number="form.recurrenceInterval"
            type="number"
            min="1"
            max="365"
            class="w-16 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm text-center"
          />
          <span class="text-sm text-textSecondary">дней</span>
        </div>
      </div>
    </div>

    <!-- Напоминание -->
    <div class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Напоминание
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="reminder in reminderOptions"
          :key="reminder.value"
          type="button"
          @click="form.reminderMinutes = reminder.value"
          class="px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all whitespace-nowrap"
          :class="form.reminderMinutes === reminder.value 
            ? 'border-primary bg-primary/5 text-primary' 
            : 'border-gray-200 text-text hover:border-gray-300'"
        >
          {{ reminder.label }}
        </button>
      </div>
    </div>

    <!-- Участники -->
    <div class="min-w-0">
      <label class="block text-sm font-semibold text-text mb-2">
        Участники
      </label>
      
      <!-- Выбранные участники -->
      <div v-if="selectedContacts.length > 0" class="flex flex-wrap gap-2 mb-3">
        <div 
          v-for="contact in selectedContacts" 
          :key="contact.id"
          class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full max-w-full"
        >
          <span class="text-sm font-medium text-primary truncate">{{ contact.name }}</span>
          <button 
            type="button"
            @click="removeParticipant(contact.id)"
            class="text-primary hover:text-primaryLight flex-shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Кнопка добавления участников -->
      <button
        type="button"
        @click="showContactPicker = true"
        class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-textSecondary hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-sm font-medium">Добавить участников</span>
      </button>
    </div>

    <!-- Кнопки действий -->
    <div class="flex gap-3 pt-4">
      <button
        v-if="showCancel"
        type="button"
        @click="$emit('cancel')"
        class="flex-1 px-4 py-3 bg-gray-100 text-text rounded-xl font-semibold hover:bg-gray-200 transition-all"
      >
        Отмена
      </button>
      <button
        type="submit"
        :disabled="isSubmitting"
        class="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primaryLight transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <LoadingSpinner v-if="isSubmitting" size="small" color="white" />
        <span>{{ submitLabel }}</span>
      </button>
    </div>

    <!-- Модальное окно выбора контактов -->
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="showContactPicker" 
          class="fixed inset-0 bg-black/50 z-50 flex items-end"
          @click.self="showContactPicker = false"
        >
          <div class="bg-white w-full rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div class="p-4 border-b flex items-center justify-between">
              <h3 class="text-lg font-bold text-text">Выберите участников</h3>
              <button 
                type="button"
                @click="showContactPicker = false"
                class="text-textSecondary hover:text-text"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div class="p-4 overflow-y-auto max-h-[50vh]">
              <div v-if="availableContacts.length === 0" class="text-center py-8">
                <p class="text-textSecondary">Нет доступных контактов</p>
              </div>
              
              <div v-else class="space-y-2">
                <button
                  v-for="contact in availableContacts"
                  :key="contact.id"
                  type="button"
                  @click="toggleParticipant(contact)"
                  class="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                  :class="isSelected(contact.id) 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'"
                >
                  <div class="relative">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primaryLight flex items-center justify-center text-white font-semibold">
                      {{ contact.name.charAt(0).toUpperCase() }}
                    </div>
                    <!-- Индикатор связанного пользователя -->
                    <div 
                      v-if="contact.linkedUserId"
                      class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center border-2 border-white"
                      :title="contact.isMutual ? 'Взаимная связь' : 'В системе'"
                    >
                      <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1 text-left">
                    <p class="font-medium text-text">{{ contact.name }}</p>
                    <p v-if="contact.username" class="text-xs text-textSecondary">@{{ contact.username }}</p>
                    <p v-if="contact.linkedUserId" class="text-xs text-primary">Получит уведомление</p>
                  </div>
                  <div v-if="isSelected(contact.id)" class="text-primary">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
            
            <div class="p-4 border-t">
              <button
                type="button"
                @click="showContactPicker = false"
                class="w-full px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primaryLight transition-all"
              >
                Готово ({{ form.participantContactIds.length }})
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useContacts, type Contact } from '~/composables/useContacts'
import type { Event, EventType, RecurrencePattern, CreateEventData, UpdateEventData } from '~/composables/useEvents'

interface Props {
  /** Событие для редактирования (если не указано - создание) */
  event?: Event
  /** Показывать кнопку отмены */
  showCancel?: boolean
  /** Текст кнопки отправки */
  submitLabel?: string
  /** Состояние отправки */
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCancel: true,
  submitLabel: 'Создать событие',
  isSubmitting: false
})

const emit = defineEmits<{
  (e: 'submit', data: CreateEventData | UpdateEventData): void
  (e: 'cancel'): void
}>()

// Composables
const { contacts, fetchContacts } = useContacts()

// Состояние формы
const form = reactive({
  title: '',
  type: 'meeting' as EventType,
  customType: '',
  description: '',
  date: '',
  time: '',
  duration: 60,
  isRecurring: false,
  recurrencePattern: 'weekly' as RecurrencePattern,
  recurrenceInterval: 7,
  reminderMinutes: 60,
  participantContactIds: [] as number[]
})

const errors = reactive({
  title: '',
  customType: '',
  date: '',
  time: ''
})

const showContactPicker = ref(false)
const showCustomDuration = ref(false)
const customDurationMinutes = ref(90)

// Типы событий
const eventTypes = [
  { value: 'meeting' as EventType, label: 'Встреча', icon: '🤝' },
  { value: 'call' as EventType, label: 'Звонок', icon: '📞' },
  { value: 'trip' as EventType, label: 'Поездка', icon: '✈️' },
  { value: 'other' as EventType, label: 'Другое', icon: '📅' }
]

// Варианты продолжительности
const durations = [
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 120, label: '2 часа' }
]

// Паттерны повторения
const recurrencePatterns = [
  { value: 'daily' as RecurrencePattern, label: 'Ежедневно' },
  { value: 'weekly' as RecurrencePattern, label: 'Еженедельно' },
  { value: 'monthly' as RecurrencePattern, label: 'Ежемесячно' },
  { value: 'custom' as RecurrencePattern, label: 'Другое' }
]

// Варианты напоминания
const reminderOptions = [
  { value: 15, label: '15 мин' },
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 1440, label: '1 день' }
]

// Минимальная дата (сегодня)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Доступные контакты для выбора (все контакты, не только отслеживаемые)
const availableContacts = computed(() => {
  return contacts.value
})

// Выбранные контакты
const selectedContacts = computed(() => {
  return contacts.value.filter(c => form.participantContactIds.includes(c.id))
})

/**
 * Проверить, выбран ли контакт
 */
const isSelected = (contactId: number): boolean => {
  return form.participantContactIds.includes(contactId)
}

/**
 * Переключить выбор участника
 */
const toggleParticipant = (contact: Contact) => {
  const index = form.participantContactIds.indexOf(contact.id)
  if (index === -1) {
    form.participantContactIds.push(contact.id)
  } else {
    form.participantContactIds.splice(index, 1)
  }
}

/**
 * Удалить участника
 */
const removeParticipant = (contactId: number) => {
  const index = form.participantContactIds.indexOf(contactId)
  if (index !== -1) {
    form.participantContactIds.splice(index, 1)
  }
}

/**
 * Валидация формы
 */
const validate = (): boolean => {
  let isValid = true
  
  // Сброс ошибок
  errors.title = ''
  errors.customType = ''
  errors.date = ''
  errors.time = ''
  
  // Проверка названия
  if (!form.title.trim()) {
    errors.title = 'Введите название события'
    isValid = false
  }
  
  // Проверка кастомного типа
  if (form.type === 'other' && !form.customType.trim()) {
    errors.customType = 'Укажите тип события'
    isValid = false
  }
  
  // Проверка даты
  if (!form.date) {
    errors.date = 'Выберите дату'
    isValid = false
  }
  
  // Проверка времени
  if (!form.time) {
    errors.time = 'Выберите время'
    isValid = false
  }
  
  // Проверка что дата в будущем
  if (form.date && form.time) {
    const eventDate = new Date(`${form.date}T${form.time}`)
    if (eventDate <= new Date()) {
      errors.date = 'Дата должна быть в будущем'
      isValid = false
    }
  }
  
  return isValid
}

/**
 * Обработка отправки формы
 */
const handleSubmit = () => {
  if (!validate()) return
  
  const startDate = new Date(`${form.date}T${form.time}`).toISOString()
  
  const data: CreateEventData = {
    title: form.title.trim(),
    type: form.type,
    customType: form.type === 'other' ? form.customType.trim() : undefined,
    description: form.description.trim() || undefined,
    startDate,
    duration: form.duration,
    isRecurring: form.isRecurring,
    recurrencePattern: form.isRecurring ? form.recurrencePattern : undefined,
    recurrenceInterval: form.isRecurring && form.recurrencePattern === 'custom' 
      ? form.recurrenceInterval 
      : undefined,
    reminderMinutes: form.reminderMinutes,
    participantContactIds: form.participantContactIds.length > 0 
      ? form.participantContactIds 
      : undefined
  }
  
  emit('submit', data)
}

// Инициализация формы при редактировании
watch(() => props.event, (event) => {
  if (event) {
    const startDate = new Date(event.startDate)
    form.title = event.title
    form.type = event.type
    form.customType = event.customType || ''
    form.description = event.description || ''
    form.date = startDate.toISOString().split('T')[0]
    form.time = startDate.toTimeString().slice(0, 5)
    form.duration = event.duration
    form.isRecurring = event.isRecurring
    form.recurrencePattern = event.recurrencePattern || 'weekly'
    form.recurrenceInterval = event.recurrenceInterval || 7
    form.reminderMinutes = event.reminderMinutes
    form.participantContactIds = event.participants?.map(p => p.contactId) || []
  }
}, { immediate: true })

// Загрузка контактов
onMounted(() => {
  fetchContacts()
})
</script>

<style scoped>
/* Анимация модального окна */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: translateY(100%);
}
</style>
