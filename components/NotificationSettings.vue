<template>
  <div class="space-y-4">
    <!-- Заголовок секции -->
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div>
        <h3 class="font-semibold text-text">Уведомления</h3>
        <p class="text-xs text-textSecondary">Настройте типы уведомлений</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="isLoading" class="flex items-center justify-center py-8">
      <LoadingSpinner size="medium" />
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="p-4 bg-red-50 rounded-xl">
      <p class="text-red-600 text-sm">{{ error }}</p>
      <button 
        @click="fetchSettings"
        class="mt-2 text-sm text-primary font-medium"
      >
        Попробовать снова
      </button>
    </div>

    <!-- Настройки -->
    <div v-else class="space-y-1">
      <!-- Напоминания о событиях -->
      <SettingToggle
        :enabled="settings.eventReminders"
        :saving="savingKey === 'eventReminders'"
        icon="📅"
        title="Напоминания о событиях"
        description="Уведомления перед началом событий"
        @toggle="handleToggle('eventReminders')"
      />

      <!-- Приглашения -->
      <SettingToggle
        :enabled="settings.invitationNotifications"
        :saving="savingKey === 'invitationNotifications'"
        icon="✉️"
        title="Приглашения"
        description="Уведомления о новых приглашениях"
        @toggle="handleToggle('invitationNotifications')"
      />

      <!-- Связи -->
      <SettingToggle
        :enabled="settings.connectionNotifications"
        :saving="savingKey === 'connectionNotifications'"
        icon="🤝"
        title="Новые связи"
        description="Когда кто-то добавляет вас в контакты"
        @toggle="handleToggle('connectionNotifications')"
      />

      <!-- Напоминания о контактах -->
      <SettingToggle
        :enabled="settings.reminderNotifications"
        :saving="savingKey === 'reminderNotifications'"
        icon="⏰"
        title="Напоминания о контактах"
        description="Напоминания связаться с контактами"
        @toggle="handleToggle('reminderNotifications')"
      />

      <!-- Разделитель -->
      <div class="h-px bg-gray-100 my-3" />

      <!-- Время напоминания по умолчанию -->
      <div class="py-3">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-xl">🕐</span>
            <div>
              <p class="font-medium text-text text-sm">Время напоминания</p>
              <p class="text-xs text-textSecondary">За сколько напоминать о событиях</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="option in REMINDER_OPTIONS"
            :key="option.value"
            @click="handleReminderChange(option.value)"
            :disabled="isSaving"
            class="px-2 py-2.5 rounded-xl border-2 text-xs font-medium transition-all disabled:opacity-50"
            :class="settings.defaultReminderMinutes === option.value 
              ? 'border-primary bg-primary/5 text-primary' 
              : 'border-gray-200 text-text hover:border-gray-300'"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNotificationSettings, REMINDER_OPTIONS } from '~/composables/useNotificationSettings'
import { useNotifications } from '~/composables/useNotifications'
import type { NotificationSettingsData } from '~/composables/useNotificationSettings'

// Composables
const { 
  settings, 
  isLoading, 
  isSaving, 
  error, 
  fetchSettings, 
  toggleSetting,
  setDefaultReminderMinutes 
} = useNotificationSettings()

const { showSuccess, showError } = useNotifications()

// Отслеживание какая настройка сохраняется
const savingKey = ref<string | null>(null)

/**
 * Обработка переключения настройки
 */
const handleToggle = async (key: keyof Omit<NotificationSettingsData, 'defaultReminderMinutes'>) => {
  savingKey.value = key
  const success = await toggleSetting(key)
  savingKey.value = null
  
  if (success) {
    showSuccess('Настройки сохранены', '✓')
  } else {
    showError('Не удалось сохранить настройки')
  }
}

/**
 * Обработка изменения времени напоминания
 */
const handleReminderChange = async (minutes: number) => {
  if (settings.value.defaultReminderMinutes === minutes) return
  
  savingKey.value = 'defaultReminderMinutes'
  const success = await setDefaultReminderMinutes(minutes)
  savingKey.value = null
  
  if (success) {
    showSuccess('Время напоминания обновлено', '✓')
  } else {
    showError('Не удалось сохранить настройки')
  }
}

// Загрузка настроек при монтировании
onMounted(() => {
  fetchSettings()
})
</script>
