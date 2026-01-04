<template>
  <div class="min-h-screen bg-background pb-28 overflow-x-hidden">
    <div class="p-4 max-w-full overflow-hidden">
      <!-- Заголовок -->
      <header class="mb-6">
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="w-10 h-10 rounded-full bg-backgroundSecondary flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg class="w-5 h-5 text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-text">Приглашения</h1>
            <p class="text-textSecondary text-sm mt-0.5">
              Приглашения на события от других пользователей
            </p>
          </div>
        </div>
      </header>

      <!-- Вкладки -->
      <div class="flex gap-2 mb-4">
        <button
          @click="activeTab = 'pending'"
          :class="[
            'flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            activeTab === 'pending'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-backgroundSecondary text-text hover:bg-gray-100'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <span>Ожидающие</span>
            <span 
              v-if="pendingCount > 0"
              class="px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === 'pending' ? 'bg-white/20' : 'bg-primary/10 text-primary'"
            >
              {{ pendingCount }}
            </span>
          </span>
        </button>
        <button
          @click="activeTab = 'history'"
          :class="[
            'flex-1 px-4 py-3 rounded-xl font-semibold transition-all text-sm',
            activeTab === 'history'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-backgroundSecondary text-text hover:bg-gray-100'
          ]"
        >
          <span class="flex items-center justify-center gap-2">
            <span>История</span>
            <span 
              v-if="historyCount > 0"
              class="px-2 py-0.5 rounded-full text-xs"
              :class="activeTab === 'history' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'"
            >
              {{ historyCount }}
            </span>
          </span>
        </button>
      </div>

      <!-- Состояние загрузки -->
      <SkeletonLoader 
        v-if="isLoading" 
        type="card" 
        :count="3" 
      />

      <!-- Ошибка -->
      <ErrorMessage
        v-else-if="error"
        :message="error"
        title="Ошибка загрузки приглашений"
        type="error"
        retryable
        :on-retry="loadInvitations"
      />

      <!-- Контент вкладки "Ожидающие" -->
      <div v-else-if="activeTab === 'pending'" class="space-y-3">
        <!-- Пустое состояние -->
        <div v-if="pendingInvitations.length === 0" class="bg-backgroundSecondary rounded-3xl shadow-sm p-8 text-center">
          <div class="text-6xl mb-4">📬</div>
          <h3 class="text-xl font-bold text-text mb-2">Нет новых приглашений</h3>
          <p class="text-textSecondary">
            Когда вас пригласят на событие, приглашение появится здесь
          </p>
        </div>

        <!-- Список приглашений -->
        <TransitionGroup name="invitation" tag="div" class="space-y-3">
          <InvitationCard
            v-for="invitation in pendingInvitations"
            :key="invitation.id"
            :ref="(el: any) => setCardRef(invitation.id, el)"
            :invitation="invitation"
            @accept="handleAccept"
            @decline="handleDecline"
          />
        </TransitionGroup>
      </div>

      <!-- Контент вкладки "История" -->
      <div v-else-if="activeTab === 'history'" class="space-y-3">
        <!-- Пустое состояние -->
        <div v-if="historyInvitations.length === 0" class="bg-backgroundSecondary rounded-3xl shadow-sm p-8 text-center">
          <div class="text-6xl mb-4">📋</div>
          <h3 class="text-xl font-bold text-text mb-2">История пуста</h3>
          <p class="text-textSecondary">
            Здесь будут отображаться приглашения, на которые вы ответили
          </p>
        </div>

        <!-- Список истории -->
        <InvitationCard
          v-for="invitation in historyInvitations"
          :key="invitation.id"
          :invitation="invitation"
          :show-event-status="true"
        />
      </div>
    </div>

    <!-- Нижняя навигация -->
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInvitations, type Invitation } from '~/composables/useInvitations'
import { useNotifications } from '~/composables/useNotifications'

const router = useRouter()

// Composables
const {
  invitations,
  pendingInvitations,
  isLoading,
  error,
  pendingCount,
  fetchInvitations,
  acceptInvitation,
  declineInvitation
} = useInvitations()

const { showSuccess, showError } = useNotifications()

// Локальное состояние
const activeTab = ref<'pending' | 'history'>('pending')
const cardRefs = ref<Record<number, any>>({})

/**
 * История приглашений (принятые и отклонённые)
 */
const historyInvitations = computed(() =>
  invitations.value.filter(i => i.status !== 'pending')
)

const historyCount = computed(() => historyInvitations.value.length)

/**
 * Сохранить ссылку на компонент карточки
 */
const setCardRef = (id: number, el: any) => {
  if (el) {
    cardRefs.value[id] = el
  }
}

/**
 * Загрузить приглашения
 */
const loadInvitations = async () => {
  try {
    // Загружаем все приглашения (не только pending) для истории
    await fetchInvitations(false)
  } catch (err) {
    console.error('Ошибка загрузки приглашений:', err)
  }
}

/**
 * Вернуться назад
 */
const goBack = () => {
  router.push('/')
}

/**
 * Обработчик принятия приглашения
 */
const handleAccept = async (invitation: Invitation) => {
  try {
    await acceptInvitation(invitation.id)
    showSuccess('Приглашение принято', '✅')
    
    // Сбрасываем состояние загрузки карточки
    const cardRef = cardRefs.value[invitation.id]
    if (cardRef?.resetLoading) {
      cardRef.resetLoading()
    }
  } catch (err: any) {
    console.error('Ошибка принятия приглашения:', err)
    showError(
      err.data?.statusMessage || err.message || 'Не удалось принять приглашение',
      'Ошибка'
    )
    
    // Сбрасываем состояние загрузки карточки
    const cardRef = cardRefs.value[invitation.id]
    if (cardRef?.resetLoading) {
      cardRef.resetLoading()
    }
  }
}

/**
 * Обработчик отклонения приглашения
 */
const handleDecline = async (invitation: Invitation) => {
  try {
    await declineInvitation(invitation.id)
    showSuccess('Приглашение отклонено', '❌')
    
    // Сбрасываем состояние загрузки карточки
    const cardRef = cardRefs.value[invitation.id]
    if (cardRef?.resetLoading) {
      cardRef.resetLoading()
    }
  } catch (err: any) {
    console.error('Ошибка отклонения приглашения:', err)
    showError(
      err.data?.statusMessage || err.message || 'Не удалось отклонить приглашение',
      'Ошибка'
    )
    
    // Сбрасываем состояние загрузки карточки
    const cardRef = cardRefs.value[invitation.id]
    if (cardRef?.resetLoading) {
      cardRef.resetLoading()
    }
  }
}

// Загрузить данные при монтировании
onMounted(() => {
  loadInvitations()
})
</script>

<style scoped>
/* Предотвращаем горизонтальный скролл */
.overflow-x-hidden {
  overflow-x: hidden;
}

/* Анимация для списка приглашений */
.invitation-move,
.invitation-enter-active,
.invitation-leave-active {
  transition: all 0.3s ease;
}

.invitation-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.invitation-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.invitation-leave-active {
  position: absolute;
  width: calc(100% - 2rem);
}
</style>
