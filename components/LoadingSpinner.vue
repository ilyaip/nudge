<template>
  <div :class="containerClass">
    <div 
      :class="spinnerClass"
      class="animate-spin rounded-full border-b-2"
    ></div>
    <p v-if="message" :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Компонент индикатора загрузки
 * Отображает анимированный спиннер с опциональным сообщением
 */

interface Props {
  /** Размер спиннера: small, medium, large */
  size?: 'small' | 'medium' | 'large'
  /** Цвет спиннера */
  color?: 'blue' | 'white' | 'gray'
  /** Сообщение под спиннером */
  message?: string
  /** Центрировать по вертикали */
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  color: 'blue',
  centered: false
})

/**
 * Классы для контейнера
 */
const containerClass = computed(() => {
  const classes = ['flex flex-col items-center justify-center gap-3']
  
  if (props.centered) {
    classes.push('min-h-[200px]')
  }
  
  return classes.join(' ')
})

/**
 * Классы для спиннера
 */
const spinnerClass = computed(() => {
  const classes = []
  
  // Размер
  switch (props.size) {
    case 'small':
      classes.push('h-6 w-6')
      break
    case 'large':
      classes.push('h-16 w-16')
      break
    default:
      classes.push('h-12 w-12')
  }
  
  // Цвет
  switch (props.color) {
    case 'white':
      classes.push('border-white')
      break
    case 'gray':
      classes.push('border-gray-600')
      break
    default:
      classes.push('border-blue-600')
  }
  
  return classes.join(' ')
})

/**
 * Классы для сообщения
 */
const messageClass = computed(() => {
  const classes = ['text-sm']
  
  switch (props.color) {
    case 'white':
      classes.push('text-white')
      break
    case 'gray':
      classes.push('text-gray-600')
      break
    default:
      classes.push('text-gray-600')
  }
  
  return classes.join(' ')
})
</script>
