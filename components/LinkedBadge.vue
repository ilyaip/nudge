<template>
  <div 
    class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
    :class="badgeClass"
    :title="badgeTitle"
  >
    <!-- Иконка взаимной связи (два человека) -->
    <svg 
      v-if="isMutual" 
      class="w-3 h-3 text-white" 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
    <!-- Иконка "в системе" (галочка) -->
    <svg 
      v-else 
      class="w-3 h-3 text-white" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      stroke-width="3"
    >
      <path 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        d="M5 13l4 4L19 7"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** Является ли связь взаимной */
  isMutual?: boolean
  /** Размер бейджа: small, medium */
  size?: 'small' | 'medium'
}

const props = withDefaults(defineProps<Props>(), {
  isMutual: false,
  size: 'medium'
})

/**
 * CSS класс для бейджа в зависимости от типа связи
 */
const badgeClass = computed(() => {
  const baseClass = props.isMutual 
    ? 'bg-gradient-to-br from-primary to-primaryLight' 
    : 'bg-primary'
  
  const sizeClass = props.size === 'small' 
    ? 'w-4 h-4' 
    : 'w-5 h-5'
  
  return `${baseClass} ${sizeClass}`
})

/**
 * Текст подсказки для бейджа
 */
const badgeTitle = computed(() => {
  return props.isMutual ? 'Взаимная связь' : 'В системе Nudge'
})
</script>

<style scoped>
/* Анимация появления бейджа */
.linked-badge-enter-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.linked-badge-enter-from {
  transform: scale(0);
  opacity: 0;
}
</style>
