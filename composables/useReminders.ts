import { ref, computed } from 'vue'

/**
 * Интерфейс напоминания
 */
interface Reminder {
  id: number
  userId: number
  contactId: number
  dueDate: string
  completed: boolean
  completedAt: string | null
  notificationSent: boolean
  contact?: {
    id: number
    name: string
    username: string | null
    category: string
    communicationType: string
  }
}

/**
 * Composable для управления напоминаниями
 * Получает сегодняшние напоминания, обрабатывает завершение
 */
export const useReminders = () => {
  // Состояние
  const reminders = ref<Reminder[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Вычисляемые свойства
  const todayReminders = computed(() => 
    reminders.value.filter(r => !r.completed)
  )

  const completedReminders = computed(() => 
    reminders.value.filter(r => r.completed)
  )

  const reminderCount = computed(() => todayReminders.value.length)

  /**
   * Получить сегодняшние напоминания из API
   */
  const fetchReminders = async () => {
    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<{ reminders: Reminder[] }>('/api/reminders', {
        method: 'GET'
      })

      reminders.value = data.reminders || []
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить напоминания'
      console.error('Ошибка загрузки напоминаний:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Отметить напоминание как выполненное
   * @param reminderId - ID напоминания
   */
  const completeReminder = async (reminderId: number) => {
    try {
      isLoading.value = true
      error.value = null

      await $fetch(`/api/reminders/${reminderId}/complete`, {
        method: 'POST'
      })

      // Обновить локальное состояние после завершения
      const reminderIndex = reminders.value.findIndex(r => r.id === reminderId)
      if (reminderIndex !== -1) {
        reminders.value[reminderIndex] = {
          ...reminders.value[reminderIndex],
          completed: true,
          completedAt: new Date().toISOString()
        }
      }

      // Перезагрузить напоминания для получения обновленных данных
      await fetchReminders()
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось завершить напоминание'
      console.error('Ошибка завершения напоминания:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  return {
    // Состояние
    reminders,
    isLoading,
    error,
    // Вычисляемые свойства
    todayReminders,
    completedReminders,
    reminderCount,
    // Методы
    fetchReminders,
    completeReminder,
    clearError
  }
}
