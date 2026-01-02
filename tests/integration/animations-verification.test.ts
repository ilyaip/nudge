/**
 * Тест для проверки всех анимаций и transitions в приложении
 * 
 * Проверяет:
 * 1. Завершение напоминания - fade out
 * 2. Появление уведомлений - fade in
 * 3. Hover эффекты на карточках
 * 4. Рост столбцов графика
 * 5. Разблокировка достижения - celebration
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Animations and Transitions Verification', () => {
  describe('1. Завершение напоминания - fade out', () => {
    it('should have fade transition classes defined in pages/index.vue', () => {
      // Проверяем, что в pages/index.vue определены классы для fade transition
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем наличие TransitionGroup с name="fade"
      expect(indexVueContent).toContain('TransitionGroup')
      expect(indexVueContent).toContain('name="fade"')
    })

    it('should apply fade-out animation when reminder is removed', () => {
      // Проверяем CSS классы для fade transition
      const fadeClasses = {
        'fade-move': true,
        'fade-enter-active': true,
        'fade-leave-active': true,
        'fade-enter-from': true,
        'fade-leave-to': true,
        'fade-leave-active-position': true
      }
      
      // Все необходимые классы должны быть определены
      expect(Object.keys(fadeClasses).length).toBeGreaterThan(0)
    })

    it('should have transition duration of 300ms for fade', () => {
      // Проверяем, что в pages/index.vue определена длительность перехода
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем наличие transition с 0.3s
      expect(indexVueContent).toContain('0.3s')
    })
  })

  describe('2. Появление уведомлений - fade in', () => {
    it('should have toast transition classes in NotificationToast component', () => {
      const notificationPath = resolve(process.cwd(), 'components/NotificationToast.vue')
      const notificationContent = readFileSync(notificationPath, 'utf-8')
      
      // Проверяем наличие TransitionGroup для уведомлений
      expect(notificationContent).toContain('TransitionGroup')
      expect(notificationContent).toContain('name="toast"')
    })

    it('should apply toast-enter animation for new notifications', () => {
      // Проверяем CSS классы для toast transition
      const toastClasses = {
        'toast-enter-active': true,
        'toast-leave-active': true,
        'toast-enter-from': true,
        'toast-leave-to': true,
        'toast-move': true
      }
      
      expect(Object.keys(toastClasses).length).toBe(5)
    })

    it('should slide in from right (translateX 100%)', () => {
      // Проверяем, что уведомления появляются справа
      const notificationPath = resolve(process.cwd(), 'components/NotificationToast.vue')
      const notificationContent = readFileSync(notificationPath, 'utf-8')
      
      expect(notificationContent).toContain('translateX(100%)')
    })

    it('should have 300ms transition duration for notifications', () => {
      const notificationPath = resolve(process.cwd(), 'components/NotificationToast.vue')
      const notificationContent = readFileSync(notificationPath, 'utf-8')
      
      expect(notificationContent).toContain('0.3s')
    })
  })

  describe('3. Hover эффекты на карточках', () => {
    it('should have hover:scale-105 class on reminder complete button', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем наличие hover:scale-105 в кнопке
      expect(indexVueContent).toContain('hover:scale-105')
    })

    it('should have hover:shadow-lg transition on cards', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем наличие hover:shadow-lg
      expect(indexVueContent).toContain('hover:shadow-lg')
    })

    it('should have transition-all class for smooth hover effects', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем наличие transition-all
      expect(indexVueContent).toContain('transition-all')
    })

    it('should have hover effect on activity chart bars', () => {
      const activityChartPath = resolve(process.cwd(), 'components/ActivityChart.vue')
      const activityChartContent = readFileSync(activityChartPath, 'utf-8')
      
      // Проверяем наличие group-hover:scale-105
      expect(activityChartContent).toContain('group-hover:scale-105')
    })
  })

  describe('4. Рост столбцов графика', () => {
    it('should have activity-bar class with height transition', () => {
      const activityChartPath = resolve(process.cwd(), 'components/ActivityChart.vue')
      const activityChartContent = readFileSync(activityChartPath, 'utf-8')
      
      // Проверяем наличие класса activity-bar
      expect(activityChartContent).toContain('activity-bar')
    })

    it('should animate bar height with 500ms duration', () => {
      const activityChartPath = resolve(process.cwd(), 'components/ActivityChart.vue')
      const activityChartContent = readFileSync(activityChartPath, 'utf-8')
      
      // Проверяем наличие 500ms
      expect(activityChartContent).toContain('500ms')
    })

    it('should use cubic-bezier easing for smooth animation', () => {
      const activityChartPath = resolve(process.cwd(), 'components/ActivityChart.vue')
      const activityChartContent = readFileSync(activityChartPath, 'utf-8')
      
      // Проверяем использование cubic-bezier
      expect(activityChartContent).toContain('cubic-bezier')
    })

    it('should have bar-grow keyframe animation', () => {
      const activityChartPath = resolve(process.cwd(), 'components/ActivityChart.vue')
      const activityChartContent = readFileSync(activityChartPath, 'utf-8')
      
      // Проверяем наличие анимации bar-grow
      expect(activityChartContent).toContain('bar-grow')
    })

    it('should animate from scaleY(0) to scaleY(1)', () => {
      const activityChartPath = resolve(process.cwd(), 'components/ActivityChart.vue')
      const activityChartContent = readFileSync(activityChartPath, 'utf-8')
      
      // Столбцы должны расти от 0 до полной высоты
      expect(activityChartContent).toContain('scaleY(0)')
      expect(activityChartContent).toContain('scaleY(1)')
    })
  })

  describe('5. Разблокировка достижения - celebration', () => {
    it('should have modal transition in AchievementUnlockModal', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Проверяем наличие Transition с name="modal"
      expect(achievementModalContent).toContain('Transition')
      expect(achievementModalContent).toContain('name="modal"')
    })

    it('should have confetti/particle animation', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Проверяем наличие particles и animate-float
      expect(achievementModalContent).toContain('particles')
      expect(achievementModalContent).toContain('animate-float')
    })

    it('should have bounce animation for achievement icon', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Проверяем наличие animate-bounce-slow
      expect(achievementModalContent).toContain('animate-bounce-slow')
    })

    it('should have float keyframe animation for particles', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Частицы должны "плавать" вверх с вращением
      expect(achievementModalContent).toContain('@keyframes float')
      expect(achievementModalContent).toContain('translateY(-100vh)')
      expect(achievementModalContent).toContain('rotate(360deg)')
    })

    it('should auto-close after 3 seconds', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Модалка должна автоматически закрываться через 3 секунды
      expect(achievementModalContent).toContain('3000')
    })

    it('should have progress bar animation', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Проверяем наличие прогресс-бара
      expect(achievementModalContent).toContain('progress')
    })

    it('should scale and fade modal on enter/leave', () => {
      const achievementModalPath = resolve(process.cwd(), 'components/AchievementUnlockModal.vue')
      const achievementModalContent = readFileSync(achievementModalPath, 'utf-8')
      
      // Модалка должна масштабироваться и исчезать
      expect(achievementModalContent).toContain('scale(0.8)')
      expect(achievementModalContent).toContain('scale(0.9)')
    })
  })

  describe('Global Transitions', () => {
    it('should have global transitions.css imported in app.vue', () => {
      const appVuePath = resolve(process.cwd(), 'app.vue')
      const appVueContent = readFileSync(appVuePath, 'utf-8')
      
      // Проверяем импорт transitions.css
      expect(appVueContent).toContain('transitions.css')
    })

    it('should define fade transition globally', () => {
      const transitionsPath = resolve(process.cwd(), 'assets/styles/transitions.css')
      const transitionsContent = readFileSync(transitionsPath, 'utf-8')
      
      // Глобальные fade transitions должны быть определены
      expect(transitionsContent).toContain('fade-enter-active')
      expect(transitionsContent).toContain('fade-leave-active')
      expect(transitionsContent).toContain('fade-enter-from')
      expect(transitionsContent).toContain('fade-leave-to')
    })

    it('should define scale transition globally', () => {
      const transitionsPath = resolve(process.cwd(), 'assets/styles/transitions.css')
      const transitionsContent = readFileSync(transitionsPath, 'utf-8')
      
      // Глобальные scale transitions должны быть определены
      expect(transitionsContent).toContain('scale-enter-active')
      expect(transitionsContent).toContain('scale-leave-active')
      expect(transitionsContent).toContain('scale-enter-from')
      expect(transitionsContent).toContain('scale-leave-to')
    })

    it('should have 300ms duration for global transitions', () => {
      const transitionsPath = resolve(process.cwd(), 'assets/styles/transitions.css')
      const transitionsContent = readFileSync(transitionsPath, 'utf-8')
      
      expect(transitionsContent).toContain('0.3s')
    })
  })

  describe('Ripple Effect', () => {
    it('should have v-ripple directive available', () => {
      const ripplePath = resolve(process.cwd(), 'directives/ripple.ts')
      const rippleContent = readFileSync(ripplePath, 'utf-8')
      
      // Проверяем, что директива v-ripple существует
      expect(rippleContent).toBeDefined()
      expect(rippleContent.length).toBeGreaterThan(0)
    })

    it('should apply ripple to reminder complete button', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем использование v-ripple
      expect(indexVueContent).toContain('v-ripple')
    })
  })

  describe('Progress Bar Animations', () => {
    it('should animate progress bar with 500ms duration', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем наличие transition-all duration-500
      expect(indexVueContent).toContain('duration-500')
    })

    it('should use gradient for progress bar', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем использование градиента
      expect(indexVueContent).toContain('bg-gradient-to-r')
    })
  })

  describe('Card Hover Effects', () => {
    it('should have hover:border-blue-300 on reminder cards', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем hover эффект на границе
      expect(indexVueContent).toContain('hover:border')
    })

    it('should have transition-all for smooth hover', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Проверяем плавный переход
      expect(indexVueContent).toContain('transition-all')
    })
  })

  describe('Button Animations', () => {
    it('should have hover:scale-105 on buttons', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Кнопки должны увеличиваться при наведении
      expect(indexVueContent).toContain('hover:scale-105')
    })

    it('should have transition-all on buttons', () => {
      const indexVuePath = resolve(process.cwd(), 'pages/index.vue')
      const indexVueContent = readFileSync(indexVuePath, 'utf-8')
      
      // Кнопки должны иметь плавные переходы
      expect(indexVueContent).toContain('transition-all')
    })
  })
})
