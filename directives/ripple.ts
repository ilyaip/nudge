/**
 * Ripple effect directive for buttons
 * Creates a Material Design-like ripple animation on click
 */

import type { DirectiveBinding } from 'vue'

interface RippleOptions {
  color?: string
  duration?: number
  opacity?: number
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<RippleOptions>) {
    // Add position relative if not already positioned
    const position = window.getComputedStyle(el).position
    if (position === 'static') {
      el.style.position = 'relative'
    }

    // Ensure overflow is hidden to contain ripple
    el.style.overflow = 'hidden'

    // Get options from binding value or use defaults
    const options: RippleOptions = binding.value || {}
    const color = options.color || 'rgba(255, 255, 255, 0.5)'
    const duration = options.duration || 600
    const opacity = options.opacity || 0.5

    // Create ripple effect on click
    const createRipple = (event: MouseEvent) => {
      const button = el
      const rect = button.getBoundingClientRect()

      // Calculate ripple position
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Calculate ripple size (diameter should cover the entire button)
      const size = Math.max(rect.width, rect.height) * 2

      // Create ripple element
      const ripple = document.createElement('span')
      ripple.style.position = 'absolute'
      ripple.style.borderRadius = '50%'
      ripple.style.backgroundColor = color
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${x - size / 2}px`
      ripple.style.top = `${y - size / 2}px`
      ripple.style.opacity = String(opacity)
      ripple.style.pointerEvents = 'none'
      ripple.style.transform = 'scale(0)'
      ripple.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`

      // Add ripple to button
      button.appendChild(ripple)

      // Trigger animation
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1)'
        ripple.style.opacity = '0'
      })

      // Remove ripple after animation
      setTimeout(() => {
        ripple.remove()
      }, duration)
    }

    // Store the handler so we can remove it later
    ;(el as any)._rippleHandler = createRipple
    el.addEventListener('click', createRipple)
  },

  unmounted(el: HTMLElement) {
    // Clean up event listener
    if ((el as any)._rippleHandler) {
      el.removeEventListener('click', (el as any)._rippleHandler)
      delete (el as any)._rippleHandler
    }
  }
}
