<template>
  <div class="flex items-center justify-between py-3">
    <div class="flex items-center gap-3">
      <span class="text-xl">{{ icon }}</span>
      <div>
        <p class="font-medium text-text text-sm">{{ title }}</p>
        <p class="text-xs text-textSecondary">{{ description }}</p>
      </div>
    </div>
    
    <button
      type="button"
      @click="$emit('toggle')"
      :disabled="saving"
      class="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
      :class="enabled ? 'bg-primary' : 'bg-gray-300'"
      :aria-label="title"
      :aria-checked="enabled"
      role="switch"
    >
      <!-- Индикатор загрузки -->
      <span 
        v-if="saving"
        class="absolute inset-0 flex items-center justify-center"
      >
        <svg class="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </span>
      
      <!-- Переключатель -->
      <span 
        v-else
        class="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm"
        :class="enabled ? 'left-6' : 'left-1'"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Включена ли настройка */
  enabled: boolean
  /** Идет ли сохранение */
  saving?: boolean
  /** Иконка (emoji) */
  icon: string
  /** Заголовок */
  title: string
  /** Описание */
  description: string
}

defineProps<Props>()

defineEmits<{
  (e: 'toggle'): void
}>()
</script>
