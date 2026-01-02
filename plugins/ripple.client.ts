/**
 * Ripple directive plugin
 * Registers the v-ripple directive globally
 */

import rippleDirective from '~/directives/ripple'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('ripple', rippleDirective)
})
