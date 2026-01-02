<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 max-w-md">
    <TransitionGroup name="toast">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="toastClass(notification.type)"
        class="flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm"
      >
        <!-- Иконка -->
        <div class="flex-shrink-0 text-2xl">
          {{ getIcon(notification.type) }}
        </div>

        <!-- Контент -->
        <div class="flex-1 min-w-0">
          <h4 v-if="notification.title" :class="titleClass(notification.type)">
            {{ notification.title }}
          </h4>
          <p :class="messageClass(notification.type)">
            {{ notification.message }}
          </p>
        </div>

        <!-- Кнопка закрытия -->
        <button
          v-if="notification.dismissible"
          @click="removeNotification(notification.id)"
          :class="closeButtonClass(notification.type)"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'

/**
 * Компонент для отображения toast-уведомлений
 * Показывает уведомления в правом верхнем углу экрана
 */

const { notifications, removeNotification } = useNotifications()

/**
 * Получить иконку для типа уведомления
 */
const getIcon = (type: string): string => {
  switch (type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    default:
      return '📢'
  }
}

/**
 * Классы для toast в зависимости от типа
 */
const toastClass = (type: string): string => {
  const baseClasses = 'transition-all duration-300'
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-50/95 border-green-200`
    case 'error':
      return `${baseClasses} bg-red-50/95 border-red-200`
    case 'warning':
      return `${baseClasses} bg-yellow-50/95 border-yellow-200`
    case 'info':
      return `${baseClasses} bg-blue-50/95 border-blue-200`
    default:
      return `${baseClasses} bg-gray-50/95 border-gray-200`
  }
}

/**
 * Классы для заголовка
 */
const titleClass = (type: string): string => {
  const baseClasses = 'font-semibold text-sm mb-1'
  
  switch (type) {
    case 'success':
      return `${baseClasses} text-green-900`
    case 'error':
      return `${baseClasses} text-red-900`
    case 'warning':
      return `${baseClasses} text-yellow-900`
    case 'info':
      return `${baseClasses} text-blue-900`
    default:
      return `${baseClasses} text-gray-900`
  }
}

/**
 * Классы для сообщения
 */
const messageClass = (type: string): string => {
  const baseClasses = 'text-sm'
  
  switch (type) {
    case 'success':
      return `${baseClasses} text-green-800`
    case 'error':
      return `${baseClasses} text-red-800`
    case 'warning':
      return `${baseClasses} text-yellow-800`
    case 'info':
      return `${baseClasses} text-blue-800`
    default:
      return `${baseClasses} text-gray-800`
  }
}

/**
 * Классы для кнопки закрытия
 */
const closeButtonClass = (type: string): string => {
  const baseClasses = 'flex-shrink-0 text-lg hover:opacity-70 transition-opacity'
  
  switch (type) {
    case 'success':
      return `${baseClasses} text-green-600`
    case 'error':
      return `${baseClasses} text-red-600`
    case 'warning':
      return `${baseClasses} text-yellow-600`
    case 'info':
      return `${baseClasses} text-blue-600`
    default:
      return `${baseClasses} text-gray-600`
  }
}
</script>

<style scoped>
/* Анимации для toast */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
