import { useAuthStore } from '~/stores/auth'

interface TelegramWebApp {
  initData: string
  initDataUnsafe: any
  ready: () => void
  expand: () => void
  close: () => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export const useTelegramAuth = () => {
  const authStore = useAuthStore()
  const config = useRuntimeConfig()

  /**
   * Authenticate user with Telegram initData
   */
  const authenticate = async () => {
    try {
      authStore.setLoading(true)
      authStore.setError('')

      // Check if Telegram Web App is available
      if (!window.Telegram?.WebApp) {
        throw new Error('Telegram Web App SDK not available')
      }

      const webApp = window.Telegram.WebApp
      const initData = webApp.initData

      if (!initData) {
        throw new Error('No initData available from Telegram')
      }

      // Call authentication API
      const response = await $fetch<{ success: boolean; user?: any }>('/api/auth', {
        method: 'POST',
        body: {
          initData
        }
      })

      if (response.success && response.user) {
        // Store user in auth store
        authStore.setUser(response.user)
        
        // Signal to Telegram that the app is ready
        webApp.ready()
        
        // Expand the app to full height
        webApp.expand()

        return response.user
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error: any) {
      const errorMessage = error.data?.statusMessage || error.message || 'Authentication failed'
      authStore.setError(errorMessage)
      console.error('Authentication error:', error)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  /**
   * Logout user
   */
  const logout = () => {
    authStore.clearAuth()
  }

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  /**
   * Get current user
   */
  const user = computed(() => authStore.user)

  /**
   * Get loading state
   */
  const isLoading = computed(() => authStore.isLoading)

  /**
   * Get error state
   */
  const error = computed(() => authStore.error)

  return {
    authenticate,
    logout,
    isAuthenticated,
    user,
    isLoading,
    error
  }
}
