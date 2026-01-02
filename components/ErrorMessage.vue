<template>
  <div :class="containerClass">
    <!-- Иконка -->
    <div class="flex-shrink-0">
      <span class="text-3xl">{{ icon }}</span>
    </div>

    <!-- Контент -->
    <div class="flex-1 min-w-0">
      <!-- Заголовок -->
      <h3 v-if="title" :class="titleClass">{{ title }}</h3>
      
      <!-- Сообщение об ошибке -->
      <p :class="messageClass">{{ message }}</p>
      
      <!-- Детали ошибки (для разработки) -->
      <details v-if="details && isDevelopment" class="mt-2">
        <summary class="text-xs cursor-pointer hover:underline">
          Технические детали
        </summary>
        <pre class="mt-2 text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">{{ details }}</pre>
      </details>
    </div>

    <!-- Кнопка закрытия -->
    <button
      v-if="dismissible"
      @click="handleDismiss"
      :class="closeButtonClass"
      aria-label="Закрыть"
    >
      ✕
    </button>
  </div>

  <!-- Кнопка повтора -->
  <div v-if="retryable" class="mt-3 flex gap-2">
    <button
      @click="handleRetry"
      :disabled="isRetrying"
      :class="retryButtonClass"
    >
      <span v-if="isRetrying">⏳</span>
      <span v-else>🔄</span>
      <span>{{ isRetrying ? 'Повтор...' : 'Попробовать снова' }}</span>
    </button>
    
    <button
      v-if="onCancel"
      @click="handleCancel"
      class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      Отмена
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

/**
 * Компонент для отображения сообщений об ошибках
 * Поддерживает различные типы ошибок, повтор операций и закрытие
 */

interface Props {
  /** Сообщение об ошибке */
  message: string
  /** Заголовок (опционально) */
  title?: string
  /** Тип ошибки: error, warning, info */
  type?: 'error' | 'warning' | 'info'
  /** Технические детали ошибки */
  details?: string
  /** Можно ли закрыть сообщение */
  dismissible?: boolean
  /** Можно ли повторить операцию */
  retryable?: boolean
  /** Callback для повтора */
  onRetry?: () => void | Promise<void>
  /** Callback для закрытия */
  onDismiss?: () => void
  /** Callback для отмены */
  onCancel?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  dismissible: false,
  retryable: false
})

const emit = defineEmits<{
  retry: []
  dismiss: []
  cancel: []
}>()

// Локальное состояние
const isRetrying = ref(false)

/**
 * Проверка режима разработки
 */
const isDevelopment = computed(() => {
  return process.env.NODE_ENV === 'development'
})

/**
 * Иконка в зависимости от типа
 */
const icon = computed(() => {
  switch (props.type) {
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    default:
      return '❌'
  }
})

/**
 * Классы для контейнера
 */
const containerClass = computed(() => {
  const baseClasses = [
    'flex items-start gap-3 p-4 rounded-lg border',
    'transition-all duration-200'
  ]
  
  switch (props.type) {
    case 'warning':
      baseClasses.push('bg-yellow-50 border-yellow-200')
      break
    case 'info':
      baseClasses.push('bg-blue-50 border-blue-200')
      break
    default:
      baseClasses.push('bg-red-50 border-red-200')
  }
  
  return baseClasses.join(' ')
})

/**
 * Классы для заголовка
 */
const titleClass = computed(() => {
  const baseClasses = ['font-semibold text-sm mb-1']
  
  switch (props.type) {
    case 'warning':
      baseClasses.push('text-yellow-900')
      break
    case 'info':
      baseClasses.push('text-blue-900')
      break
    default:
      baseClasses.push('text-red-900')
  }
  
  return baseClasses.join(' ')
})

/**
 * Классы для сообщения
 */
const messageClass = computed(() => {
  const baseClasses = ['text-sm']
  
  switch (props.type) {
    case 'warning':
      baseClasses.push('text-yellow-800')
      break
    case 'info':
      baseClasses.push('text-blue-800')
      break
    default:
      baseClasses.push('text-red-800')
  }
  
  return baseClasses.join(' ')
})

/**
 * Классы для кнопки закрытия
 */
const closeButtonClass = computed(() => {
  const baseClasses = [
    'flex-shrink-0 text-lg hover:opacity-70 transition-opacity'
  ]
  
  switch (props.type) {
    case 'warning':
      baseClasses.push('text-yellow-600')
      break
    case 'info':
      baseClasses.push('text-blue-600')
      break
    default:
      baseClasses.push('text-red-600')
  }
  
  return baseClasses.join(' ')
})

/**
 * Классы для кнопки повтора
 */
const retryButtonClass = computed(() => {
  const baseClasses = [
    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg',
    'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  ]
  
  switch (props.type) {
    case 'warning':
      baseClasses.push('text-yellow-700 bg-yellow-100 hover:bg-yellow-200')
      break
    case 'info':
      baseClasses.push('text-blue-700 bg-blue-100 hover:bg-blue-200')
      break
    default:
      baseClasses.push('text-red-700 bg-red-100 hover:bg-red-200')
  }
  
  return baseClasses.join(' ')
})

/**
 * Обработать повтор операции
 */
const handleRetry = async () => {
  if (isRetrying.value) return
  
  try {
    isRetrying.value = true
    
    if (props.onRetry) {
      await props.onRetry()
    }
    
    emit('retry')
  } catch (error) {
    console.error('Ошибка при повторе операции:', error)
  } finally {
    isRetrying.value = false
  }
}

/**
 * Обработать закрытие сообщения
 */
const handleDismiss = () => {
  if (props.onDismiss) {
    props.onDismiss()
  }
  emit('dismiss')
}

/**
 * Обработать отмену
 */
const handleCancel = () => {
  if (props.onCancel) {
    props.onCancel()
  }
  emit('cancel')
}
</script>
