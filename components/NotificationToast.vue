<template>
  <Teleport to="body">
    <div class="fixed top-4 left-4 right-4 z-[100] flex flex-col items-center gap-3">
      <TransitionGroup name="toast">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="toastClass(notification.type)"
          class="w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm"
        >
          <!-- Иконка -->
          <div 
            :class="iconContainerClass(notification.type)"
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          >
            <span class="text-lg">{{ getIcon(notification.type, notification.title) }}</span>
          </div>

          <!-- Контент -->
          <div class="flex-1 min-w-0">
            <p :class="messageClass(notification.type)" class="font-semibold text-sm leading-tight">
              {{ notification.message }}
            </p>
          </div>

          <!-- Кнопка закрытия -->
          <button
            v-if="notification.dismissible"
            @click="removeNotification(notification.id)"
            :class="closeButtonClass(notification.type)"
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            aria-label="Закрыть"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'

const { notifications, removeNotification } = useNotifications()

/**
 * Получить иконку для типа уведомления
 */
const getIcon = (type: string, title?: string): string => {
  // Если в title есть эмодзи, используем его
  if (title) {
    const emojiMatch = title.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2728}]|[\u{2705}]|[\u{274C}]|[\u{26A0}]|[\u{2139}]|[\u{1F4E6}]|[\u{2699}]/gu)
    if (emojiMatch) {
      return emojiMatch[0]
    }
  }
  
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '!'
    case 'warning':
      return '⚠'
    case 'info':
      return 'i'
    case 'xp':
      return '✨'
    default:
      return '•'
  }
}

/**
 * Классы для контейнера иконки
 */
const iconContainerClass = (type: string): string => {
  switch (type) {
    case 'success':
      return 'bg-white/20'
    case 'error':
      return 'bg-white/20'
    case 'warning':
      return 'bg-yellow-500/20'
    case 'info':
      return 'bg-primary/20'
    case 'xp':
      return 'bg-white/20'
    default:
      return 'bg-gray-500/20'
  }
}

/**
 * Классы для toast в зависимости от типа
 */
const toastClass = (type: string): string => {
  switch (type) {
    case 'success':
      return 'bg-green-500 text-white'
    case 'error':
      return 'bg-red-500 text-white'
    case 'warning':
      return 'bg-yellow-500 text-white'
    case 'info':
      return 'bg-primary text-white'
    case 'xp':
      return 'gradient-purple-bright text-white'
    default:
      return 'bg-gray-800 text-white'
  }
}

/**
 * Классы для сообщения
 */
const messageClass = (type: string): string => {
  return 'text-white'
}

/**
 * Классы для кнопки закрытия
 */
const closeButtonClass = (type: string): string => {
  switch (type) {
    case 'success':
      return 'bg-white/10 hover:bg-white/20 text-white'
    case 'error':
      return 'bg-white/10 hover:bg-white/20 text-white'
    case 'warning':
      return 'bg-white/10 hover:bg-white/20 text-white'
    case 'info':
      return 'bg-white/10 hover:bg-white/20 text-white'
    case 'xp':
      return 'bg-white/10 hover:bg-white/20 text-white'
    default:
      return 'bg-white/10 hover:bg-white/20 text-white'
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
  transform: translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
