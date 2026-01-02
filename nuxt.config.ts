// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  modules: [
    '@unocss/nuxt',
    '@pinia/nuxt'
  ],

  typescript: {
    strict: true,
    typeCheck: process.env.NODE_ENV === 'development' // Отключаем type check в production
  },

  runtimeConfig: {
    // Private keys (only available server-side)
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    databaseUrl: process.env.DATABASE_URL || '',
    
    // Public keys (exposed to client)
    public: {
      appName: 'Nudge'
    }
  },

  nitro: {
    experimental: {
      tasks: true
    }
  },

  app: {
    head: {
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
        }
      ],
      script: [
        {
          src: 'https://telegram.org/js/telegram-web-app.js',
          defer: true
        }
      ]
    }
  }
})
