import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'
import { colors } from './assets/styles/colors'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons()
  ],
  theme: {
    colors: {
      primary: colors.primary,
      primaryDark: colors.primaryDark,
      primaryLight: colors.primaryLight,
      background: colors.background,
      backgroundSecondary: colors.backgroundSecondary,
      text: colors.text,
      textSecondary: colors.textSecondary
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    }
  },
  shortcuts: {
    'gradient-purple-dark': 'bg-gradient-to-br from-[#4A148C] to-[#6A1B9A]',
    'gradient-purple-bright': 'bg-gradient-to-br from-[#6B3CE9] to-[#8B5CF6]',
    'gradient-purple-header': 'bg-gradient-to-br from-[#5E35B1] to-[#7E57C2]'
  }
})
