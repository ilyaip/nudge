<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-50 safe-area-bottom">
    <div class="flex justify-around items-center h-20 px-4 relative">
      <!-- Dashboard -->
      <NuxtLink
        to="/"
        :class="[
          'flex flex-col items-center justify-center gap-1 transition-all duration-300',
          isActive('/') ? 'text-primary' : 'text-gray-400'
        ]"
      >
        <svg 
          class="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      </NuxtLink>

      <!-- Contacts -->
      <NuxtLink
        to="/contacts"
        :class="[
          'flex flex-col items-center justify-center gap-1 transition-all duration-300',
          isActive('/contacts') ? 'text-primary' : 'text-gray-400'
        ]"
      >
        <svg 
          class="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </NuxtLink>

      <!-- Center Action Button (Add Contact) -->
      <button
        @click="handleAddContact"
        class="center-button"
      >
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primaryLight shadow-lg flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95">
          <svg 
            class="w-8 h-8 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      </button>

      <!-- Achievements -->
      <NuxtLink
        to="/achievements"
        :class="[
          'flex flex-col items-center justify-center gap-1 transition-all duration-300',
          isActive('/achievements') ? 'text-primary' : 'text-gray-400'
        ]"
      >
        <svg 
          class="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </NuxtLink>

      <!-- Profile -->
      <NuxtLink
        to="/profile"
        :class="[
          'flex flex-col items-center justify-center gap-1 transition-all duration-300',
          isActive('/profile') ? 'text-primary' : 'text-gray-400'
        ]"
      >
        <svg 
          class="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

/**
 * Проверить, активна ли ссылка
 */
const isActive = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

/**
 * Обработать добавление контакта
 */
const handleAddContact = () => {
  // Переходим на страницу контактов и открываем модалку
  if (route.path !== '/contacts') {
    router.push('/contacts?add=true')
  } else {
    // Если уже на странице контактов, эмитим событие
    window.dispatchEvent(new CustomEvent('open-add-contact-modal'))
  }
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Убираем все возможные рамки и outline для центральной кнопки */
.center-button {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -2rem;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.center-button:focus {
  outline: none;
  box-shadow: none;
}

.center-button:focus-visible {
  outline: none;
  box-shadow: none;
}

.center-button:active {
  outline: none;
  box-shadow: none;
}

/* Убираем outline для всех кнопок в навигации */
button {
  -webkit-tap-highlight-color: transparent;
}

button:focus {
  outline: none;
}

button:focus-visible {
  outline: none;
}
</style>
