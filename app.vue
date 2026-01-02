<template>
  <div>
    <NuxtPage />
    <NotificationToast />
    <AchievementUnlockModal 
      :achievement="currentAchievement" 
      @close="handleAchievementClose"
    />
  </div>
</template>

<script setup lang="ts">
import { useAchievementModal } from '~/composables/useAchievementModal'

// Telegram Web App initialization will be added later

// Achievement modal
const { currentAchievement, handleClose: handleAchievementClose } = useAchievementModal()
</script>

<style>
@import '~/assets/styles/transitions.css';

/* Global styles */
* {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Safe area for iOS */
body {
  padding-bottom: env(safe-area-inset-bottom);
}

/* Responsive container */
.container-responsive {
  max-width: 100%;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .container-responsive {
    max-width: 640px;
  }
}

@media (min-width: 768px) {
  .container-responsive {
    max-width: 768px;
  }
}

@media (min-width: 1024px) {
  .container-responsive {
    max-width: 1024px;
  }
}
</style>
