<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
    <div class="flex justify-around items-center h-16">
      <!-- Dashboard -->
      <NuxtLink
        to="/"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        ]"
      >
        <span class="text-2xl mb-1">🏠</span>
        <span class="text-xs font-medium">Главная</span>
      </NuxtLink>

      <!-- Contacts -->
      <NuxtLink
        to="/contacts"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive('/contacts') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        ]"
      >
        <span class="text-2xl mb-1">👥</span>
        <span class="text-xs font-medium">Контакты</span>
      </NuxtLink>

      <!-- Achievements -->
      <NuxtLink
        to="/achievements"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive('/achievements') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
        ]"
      >
        <span class="text-2xl mb-1">🏆</span>
        <span class="text-xs font-medium">Достижения</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

/**
 * Проверить, активна ли ссылка
 */
const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
