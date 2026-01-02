import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  telegramId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  currentStreak: number
  longestStreak: number
  totalXP: number
  level: number
}

/**
 * Auth store - управление состоянием аутентификации пользователя
 * Использует Composition API стиль для Pinia
 */
export const useAuthStore = defineStore('auth', () => {
  // State (реактивные переменные)
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters (вычисляемые свойства)
  const currentUser = computed(() => user.value)
  const isLoggedIn = computed(() => isAuthenticated.value)

  // Actions (функции для изменения состояния)
  function setUser(newUser: User) {
    user.value = newUser
    isAuthenticated.value = true
    error.value = null
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(errorMessage: string) {
    error.value = errorMessage
    isLoading.value = false
  }

  function clearAuth() {
    user.value = null
    isAuthenticated.value = false
    error.value = null
  }

  // Возвращаем все, что нужно экспортировать
  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    // Getters
    currentUser,
    isLoggedIn,
    // Actions
    setUser,
    setLoading,
    setError,
    clearAuth
  }
})
