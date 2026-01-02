<template>
  <div :class="containerClass">
    <!-- Заголовок -->
    <div v-if="showHeader" class="space-y-3 mb-6">
      <div class="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
    </div>

    <!-- Карточки -->
    <div v-if="type === 'card'" class="space-y-4">
      <div 
        v-for="i in count" 
        :key="i"
        class="bg-white rounded-lg shadow-md p-6 animate-pulse"
      >
        <div class="flex items-start gap-4">
          <!-- Аватар/иконка -->
          <div class="h-12 w-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          
          <!-- Контент -->
          <div class="flex-1 space-y-3">
            <div class="h-5 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            <div class="flex gap-2">
              <div class="h-6 bg-gray-200 rounded w-20"></div>
              <div class="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список -->
    <div v-else-if="type === 'list'" class="space-y-3">
      <div 
        v-for="i in count" 
        :key="i"
        class="bg-white rounded-lg shadow-sm p-4 animate-pulse"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div class="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Таблица -->
    <div v-else-if="type === 'table'" class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="animate-pulse">
        <!-- Заголовок таблицы -->
        <div class="bg-gray-50 p-4 border-b border-gray-200">
          <div class="flex gap-4">
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
        
        <!-- Строки таблицы -->
        <div v-for="i in count" :key="i" class="p-4 border-b border-gray-200">
          <div class="flex gap-4">
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сетка (для достижений) -->
    <div v-else-if="type === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div 
        v-for="i in count" 
        :key="i"
        class="bg-white rounded-lg shadow-md p-5 animate-pulse"
      >
        <div class="flex items-start gap-4">
          <div class="h-12 w-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-5 bg-gray-200 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded w-full"></div>
            <div class="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div v-else-if="type === 'stats'" class="space-y-6">
      <div class="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-100 rounded-lg p-4">
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              <div class="h-8 bg-gray-200 rounded w-1/3"></div>
              <div class="h-2 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
          <div class="bg-gray-100 rounded-lg p-4">
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
              <div class="h-8 bg-gray-200 rounded w-1/3"></div>
              <div class="h-2 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <div class="h-3 bg-gray-200 rounded w-full"></div>
          <div class="h-3 bg-gray-200 rounded-full w-full"></div>
        </div>
      </div>
    </div>

    <!-- Пользовательский контент -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Компонент skeleton loader для отображения состояния загрузки
 * Показывает анимированные заглушки вместо реального контента
 */

interface Props {
  /** Тип skeleton: card, list, table, grid, stats, custom */
  type?: 'card' | 'list' | 'table' | 'grid' | 'stats' | 'custom'
  /** Количество элементов для отображения */
  count?: number
  /** Показывать заголовок */
  showHeader?: boolean
  /** Дополнительные CSS классы */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  count: 3,
  showHeader: false
})

/**
 * Классы для контейнера
 */
const containerClass = computed(() => {
  const classes = []
  
  if (props.class) {
    classes.push(props.class)
  }
  
  return classes.join(' ')
})
</script>
