import { ref, computed } from 'vue'

/**
 * Интерфейс настроек уведомлений
 */
export interface NotificationSettingsData {
  eventReminders: boolean
  invitationNotifications: boolean
  connectionNotifications: boolean
  reminderNotifications: boolean
  defaultReminderMinutes: number
}

/**
 * Допустимые значения времени напоминания (в минутах)
 */
export const REMINDER_OPTIONS = [
  { value: 15, label: '15 минут' },
  { value: 30, label: '30 минут' },
  { value: 60, label: '1 час' },
  { value: 1440, label: '1 день' }
] as const

/**
 * Composable для управления настройками уведомлений
 * Requirements: 11.4, 12.1, 12.2
 */
export const useNotificationSettings = () => {
  const settings = ref<NotificationSettingsData>({
    eventReminders: true,
    invitationNotifications: true,
    connectionNotifications: true,
    reminderNotifications: true,
    defaultReminderMinutes: 60
  })

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  /**
   * Получить настройки уведомлений
   */
  const fetchSettings = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; settings: NotificationSettingsData }>(
        '/api/notifications/settings'
      )

      if (response.success) {
        settings.value = response.settings
      }
    } catch (err: any) {
      console.error('[useNotificationSettings] Error fetching settings:', err)
      error.value = err.data?.statusMessage || 'Не удалось загрузить настройки'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Обновить настройки уведомлений
   */
  const updateSettings = async (
    updates: Partial<NotificationSettingsData>
  ): Promise<boolean> => {
    isSaving.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; settings: NotificationSettingsData }>(
        '/api/notifications/settings',
        {
          method: 'PUT',
          body: updates
        }
      )

      if (response.success) {
        settings.value = response.settings
        return true
      }
      return false
    } catch (err: any) {
      console.error('[useNotificationSettings] Error updating settings:', err)
      error.value = err.data?.statusMessage || 'Не удалось сохранить настройки'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Переключить настройку уведомлений
   */
  const toggleSetting = async (
    key: keyof Omit<NotificationSettingsData, 'defaultReminderMinutes'>
  ): Promise<boolean> => {
    const newValue = !settings.value[key]
    return updateSettings({ [key]: newValue })
  }

  /**
   * Установить время напоминания по умолчанию
   */
  const setDefaultReminderMinutes = async (minutes: number): Promise<boolean> => {
    return updateSettings({ defaultReminderMinutes: minutes })
  }

  /**
   * Получить label для времени напоминания
   */
  const getReminderLabel = computed(() => {
    const option = REMINDER_OPTIONS.find(
      opt => opt.value === settings.value.defaultReminderMinutes
    )
    return option?.label || `${settings.value.defaultReminderMinutes} мин`
  })

  return {
    // Состояние
    settings,
    isLoading,
    isSaving,
    error,
    getReminderLabel,
    // Методы
    fetchSettings,
    updateSettings,
    toggleSetting,
    setDefaultReminderMinutes,
    // Константы
    REMINDER_OPTIONS
  }
}
