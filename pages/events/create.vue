<template>
  <div class="min-h-screen bg-background pb-8 overflow-x-hidden">
    <div class="p-4 max-w-full overflow-hidden">
      <!-- Заголовок -->
      <header class="mb-6">
        <div class="flex items-center gap-3 min-w-0">
          <button
            @click="handleBack"
            class="w-10 h-10 rounded-xl bg-backgroundSecondary flex items-center justify-center hover:bg-gray-100 transition-all flex-shrink-0"
          >
            <svg class="w-6 h-6 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="min-w-0">
            <h1 class="text-xl font-bold text-text truncate">Новое событие</h1>
            <p class="text-textSecondary text-sm truncate">Создайте встречу или звонок</p>
          </div>
        </div>
      </header>

      <!-- Ошибка -->
      <ErrorMessage
        v-if="error"
        :message="error"
        title="Ошибка создания события"
        type="error"
        class="mb-4"
      />

      <!-- Форма создания события -->
      <section class="bg-backgroundSecondary rounded-3xl shadow-sm p-4 overflow-hidden">
        <EventForm
          :is-submitting="isSubmitting"
          submit-label="Создать событие"
          @submit="handleSubmit"
          @cancel="handleBack"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEvents, type CreateEventData, type UpdateEventData } from '~/composables/useEvents'
import { useNotifications } from '~/composables/useNotifications'

const router = useRouter()
const { createEvent } = useEvents()
const { showSuccess, showError } = useNotifications()

const isSubmitting = ref(false)
const error = ref<string | null>(null)

/**
 * Обработка отправки формы
 */
const handleSubmit = async (data: CreateEventData | UpdateEventData) => {
  try {
    isSubmitting.value = true
    error.value = null

    const event = await createEvent(data as CreateEventData)
    
    showSuccess('Событие создано!', '📅')
    
    // Переходим на страницу события
    router.push(`/events/${event.id}`)
  } catch (err: any) {
    const errorMessage = err.data?.statusMessage || err.message || 'Не удалось создать событие'
    error.value = errorMessage
    showError(errorMessage, '❌')
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Обработка возврата назад
 */
const handleBack = () => {
  router.back()
}
</script>
