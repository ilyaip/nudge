<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <!-- Modal Content -->
        <div
          class="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          @click.stop
        >
          <!-- Confetti/Sparkle Effect -->
          <div class="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              v-for="particle in particles"
              :key="particle.id"
              class="absolute animate-float"
              :style="{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}ms`,
                animationDuration: `${particle.duration}ms`
              }"
            >
              {{ particle.emoji }}
            </div>
          </div>

          <!-- Content -->
          <div class="relative p-8 text-center">
            <!-- Achievement Icon with pulse animation -->
            <div class="mb-6 animate-bounce-slow">
              <div class="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                <span class="text-6xl">{{ achievement?.icon || '🏆' }}</span>
              </div>
            </div>

            <!-- Title -->
            <h2 class="text-2xl font-bold text-gray-900 mb-2">
              Достижение разблокировано!
            </h2>

            <!-- Achievement Name -->
            <h3 class="text-xl font-semibold text-primary mb-3">
              {{ achievement?.name }}
            </h3>

            <!-- Description -->
            <p class="text-gray-600 mb-4">
              {{ achievement?.description }}
            </p>

            <!-- XP Reward -->
            <div class="inline-flex items-center gap-2 bg-gradient-purple-bright text-white px-6 py-3 rounded-full font-semibold shadow-lg">
              <span class="text-2xl">✨</span>
              <span>+{{ achievement?.xpReward }} XP</span>
            </div>

            <!-- Auto-close indicator -->
            <div class="mt-6">
              <div class="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                <div
                  class="bg-gradient-to-r from-primary to-primaryLight h-1 transition-all ease-linear"
                  :style="{ width: `${progress}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

/**
 * Интерфейс достижения
 */
interface Achievement {
  id: number
  code: string
  name: string
  description: string
  icon: string
  xpReward: number
}

/**
 * Интерфейс частицы для анимации
 */
interface Particle {
  id: number
  emoji: string
  x: number
  y: number
  delay: number
  duration: number
}

/**
 * Props компонента
 */
interface Props {
  achievement: Achievement | null
  autoCloseDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoCloseDuration: 3000
})

/**
 * Emits
 */
const emit = defineEmits<{
  close: []
}>()

// Состояние
const isVisible = ref(false)
const progress = ref(0)
const particles = ref<Particle[]>([])
let autoCloseTimer: NodeJS.Timeout | null = null
let progressInterval: NodeJS.Timeout | null = null

/**
 * Генерация частиц для эффекта конфетти
 */
const generateParticles = () => {
  const emojis = ['✨', '⭐', '🎉', '🎊', '💫', '🌟', '⚡', '💥']
  const particleCount = 20
  
  particles.value = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 500,
    duration: 2000 + Math.random() * 1000
  }))
}

/**
 * Показать модальное окно
 */
const show = () => {
  if (!props.achievement) return
  
  isVisible.value = true
  progress.value = 0
  generateParticles()
  
  // Запустить прогресс-бар
  const progressStep = 100 / (props.autoCloseDuration / 50)
  progressInterval = setInterval(() => {
    progress.value += progressStep
    if (progress.value >= 100) {
      progress.value = 100
      if (progressInterval) clearInterval(progressInterval)
    }
  }, 50)
  
  // Автоматически закрыть через заданное время
  autoCloseTimer = setTimeout(() => {
    close()
  }, props.autoCloseDuration)
}

/**
 * Закрыть модальное окно
 */
const close = () => {
  isVisible.value = false
  progress.value = 0
  particles.value = []
  
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
  
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  
  emit('close')
}

/**
 * Обработать клик по backdrop
 */
const handleBackdropClick = () => {
  close()
}

/**
 * Следить за изменением achievement и показывать модалку
 */
watch(() => props.achievement, (newAchievement) => {
  if (newAchievement) {
    show()
  }
}, { immediate: true })

/**
 * Очистка при размонтировании
 */
onMounted(() => {
  return () => {
    if (autoCloseTimer) clearTimeout(autoCloseTimer)
    if (progressInterval) clearInterval(progressInterval)
  }
})

// Экспортируем методы для внешнего управления
defineExpose({
  show,
  close
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from > div:last-child {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}

.modal-leave-to > div:last-child {
  transform: scale(0.9) translateY(-10px);
  opacity: 0;
}

/* Particle animation */
@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}

.animate-float {
  animation: float 3s ease-out forwards;
  font-size: 1.5rem;
}

/* Bounce animation for icon */
@keyframes bounce-slow {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.05);
  }
}

.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}

/* Pulse animation for icon background */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(251, 191, 36, 0.8);
  }
}
</style>
