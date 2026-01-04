import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCache } from '~/composables/useCache'
import type { Event } from '~/composables/useEvents'

/**
 * Интерфейс для дня календаря
 */
export interface CalendarDay {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: Event[]
  hasEvents: boolean
}

/**
 * Composable для управления календарём
 * Навигация по месяцам и запросы событий по датам
 * Requirements: 10.4
 */
export const useCalendar = () => {
  const authStore = useAuthStore()
  const { get: getCache, set: setCache, invalidate } = useCache()

  // Состояние
  const currentDate = ref(new Date())
  const selectedDate = ref<Date | null>(null)
  const monthEvents = ref<Event[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Названия месяцев на русском
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ]

  // Названия дней недели на русском (начиная с понедельника)
  const weekDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  /**
   * Текущий месяц и год
   */
  const currentMonth = computed(() => currentDate.value.getMonth())
  const currentYear = computed(() => currentDate.value.getFullYear())

  /**
   * Название текущего месяца
   */
  const currentMonthName = computed(() => {
    return `${monthNames[currentMonth.value]} ${currentYear.value}`
  })

  /**
   * Получить первый день месяца
   */
  const getFirstDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  /**
   * Получить последний день месяца
   */
  const getLastDayOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  /**
   * Получить день недели (0 = понедельник, 6 = воскресенье)
   */
  const getDayOfWeek = (date: Date): number => {
    const day = date.getDay()
    return day === 0 ? 6 : day - 1 // Преобразуем: воскресенье (0) -> 6, понедельник (1) -> 0
  }


  /**
   * Проверить, является ли дата сегодняшним днём
   */
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  /**
   * Проверить, совпадают ли две даты (по дню)
   */
  const isSameDay = (date1: Date, date2: Date | null): boolean => {
    if (!date2) return false
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  /**
   * Получить события для конкретного дня
   */
  const getEventsForDay = (date: Date): Event[] => {
    return monthEvents.value.filter(event => {
      const eventDate = new Date(event.startDate)
      return isSameDay(eventDate, date)
    })
  }

  /**
   * Генерация дней календаря для текущего месяца
   * Requirement 10.3: highlight days with events
   */
  const calendarDays = computed((): CalendarDay[] => {
    const days: CalendarDay[] = []
    const firstDay = getFirstDayOfMonth(currentDate.value)
    const lastDay = getLastDayOfMonth(currentDate.value)
    const startDayOfWeek = getDayOfWeek(firstDay)

    // Добавляем дни предыдущего месяца
    const prevMonthLastDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 0)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevMonthLastDay)
      date.setDate(prevMonthLastDay.getDate() - i)
      const dayEvents = getEventsForDay(date)
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: false,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate.value),
        events: dayEvents,
        hasEvents: dayEvents.length > 0
      })
    }

    // Добавляем дни текущего месяца
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), day)
      const dayEvents = getEventsForDay(date)
      days.push({
        date,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate.value),
        events: dayEvents,
        hasEvents: dayEvents.length > 0
      })
    }

    // Добавляем дни следующего месяца для заполнения сетки (до 42 дней = 6 недель)
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, i)
      const dayEvents = getEventsForDay(date)
      days.push({
        date,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: isToday(date),
        isSelected: isSameDay(date, selectedDate.value),
        events: dayEvents,
        hasEvents: dayEvents.length > 0
      })
    }

    return days
  })

  /**
   * События выбранного дня
   * Requirement 10.5: show events for selected day
   */
  const selectedDayEvents = computed((): Event[] => {
    if (!selectedDate.value) return []
    return getEventsForDay(selectedDate.value)
  })


  /**
   * Перейти к предыдущему месяцу
   * Requirement 10.4: navigate between months
   */
  const prevMonth = () => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() - 1)
    currentDate.value = newDate
    fetchMonthEvents()
  }

  /**
   * Перейти к следующему месяцу
   * Requirement 10.4: navigate between months
   */
  const nextMonth = () => {
    const newDate = new Date(currentDate.value)
    newDate.setMonth(newDate.getMonth() + 1)
    currentDate.value = newDate
    fetchMonthEvents()
  }

  /**
   * Перейти к текущему месяцу
   */
  const goToToday = () => {
    currentDate.value = new Date()
    selectedDate.value = new Date()
    fetchMonthEvents()
  }

  /**
   * Выбрать день
   */
  const selectDay = (date: Date) => {
    selectedDate.value = new Date(date)
  }

  /**
   * Загрузить события для текущего месяца
   * Requirement 10.4: query events by dates
   */
  const fetchMonthEvents = async () => {
    try {
      isLoading.value = true
      error.value = null

      const userId = authStore.user?.id
      if (!userId) {
        throw new Error('Пользователь не авторизован')
      }

      // Определяем диапазон дат для запроса (весь месяц + несколько дней по краям)
      const firstDay = getFirstDayOfMonth(currentDate.value)
      const lastDay = getLastDayOfMonth(currentDate.value)
      
      // Расширяем диапазон на неделю в каждую сторону для отображения событий соседних месяцев
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - 7)
      
      const endDate = new Date(lastDay)
      endDate.setDate(endDate.getDate() + 7)

      // Проверяем кэш
      const cacheKey = `calendar-events-${userId}-${currentYear.value}-${currentMonth.value}`
      const cached = getCache<Event[]>(cacheKey)

      if (cached) {
        monthEvents.value = cached
        isLoading.value = false
        return cached
      }

      // Формируем query параметры
      const queryParams = new URLSearchParams()
      queryParams.set('startFrom', startDate.toISOString())
      queryParams.set('startTo', endDate.toISOString())

      const data = await $fetch<{ success: boolean; events: Event[] }>(
        `/api/events?${queryParams.toString()}`,
        { method: 'GET' }
      )

      monthEvents.value = data.events || []

      // Сохраняем в кэш на 2 минуты
      setCache(cacheKey, monthEvents.value, 2 * 60 * 1000)

      return monthEvents.value
    } catch (err: any) {
      error.value = err.data?.statusMessage || err.message || 'Не удалось загрузить события'
      console.error('Ошибка загрузки событий календаря:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Инвалидировать кэш событий
   */
  const invalidateCache = () => {
    const userId = authStore.user?.id
    if (userId) {
      invalidate(`calendar-events-${userId}-${currentYear.value}-${currentMonth.value}`)
    }
  }

  /**
   * Очистить ошибку
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Форматировать дату для отображения
   */
  const formatSelectedDate = computed(() => {
    if (!selectedDate.value) return ''
    return selectedDate.value.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  })

  return {
    // Состояние
    currentDate,
    selectedDate,
    monthEvents,
    isLoading,
    error,
    // Вычисляемые свойства
    currentMonth,
    currentYear,
    currentMonthName,
    calendarDays,
    selectedDayEvents,
    formatSelectedDate,
    // Константы
    weekDayNames,
    monthNames,
    // Методы
    prevMonth,
    nextMonth,
    goToToday,
    selectDay,
    fetchMonthEvents,
    invalidateCache,
    clearError,
    // Утилиты
    isToday,
    isSameDay,
    getEventsForDay
  }
}
