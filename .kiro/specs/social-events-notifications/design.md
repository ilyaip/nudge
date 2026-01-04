# Design Document: Social Events & Notifications

## Overview

Данный дизайн описывает расширение приложения Nudge для поддержки социальных связей, событий с приглашениями и push-уведомлений. Архитектура построена на существующей структуре Nuxt 3 + Drizzle ORM + PostgreSQL с добавлением новых сущностей и сервисов.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Nuxt 3)                       │
├─────────────────────────────────────────────────────────────┤
│  Pages:                    │  Components:                    │
│  - / (home + events)       │  - EventCard                    │
│  - /events/[id]            │  - EventForm                    │
│  - /events/create          │  - CalendarModal                │
│  - /contacts (updated)     │  - LinkedBadge                  │
│  - /contacts/[id] (updated)│  - InvitationCard               │
│  - /invitations            │  - ParticipantList              │
│  - /connections            │  - NotificationSettings         │
├─────────────────────────────────────────────────────────────┤
│  Composables:                                                │
│  - useEvents()             - useInvitations()                │
│  - useConnections()        - useNotificationSettings()       │
│  - useCalendar()                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Nitro Server)                    │
├─────────────────────────────────────────────────────────────┤
│  API Routes:                                                 │
│  - /api/events/*           - /api/invitations/*              │
│  - /api/connections/*      - /api/notifications/*            │
│  - /api/contacts/* (updated)                                 │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│  - NotificationService     - EventSchedulerService           │
│  - ConnectionService       - RecurrenceService               │
├─────────────────────────────────────────────────────────────┤
│  Plugins:                                                    │
│  - event-status-updater.ts - notification-scheduler.ts       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────┤
│  New Tables:                                                 │
│  - events                  - event_participants              │
│  - invitations             - notification_settings           │
│  Updated Tables:                                             │
│  - contacts (+ linkedUserId, isMutual)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
├─────────────────────────────────────────────────────────────┤
│  Telegram Bot API - отправка уведомлений                     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Database Schema Extensions

```typescript
// Новая таблица: events
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  organizerId: integer('organizer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // meeting, call, trip, other
  customType: varchar('custom_type', { length: 100 }),
  description: text('description'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  duration: integer('duration').notNull(), // в минутах
  status: varchar('status', { length: 20 }).notNull().default('scheduled'), // scheduled, in_progress, completed, cancelled
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurrencePattern: varchar('recurrence_pattern', { length: 20 }), // daily, weekly, monthly, custom
  recurrenceInterval: integer('recurrence_interval'), // для custom - количество дней
  parentEventId: integer('parent_event_id').references(() => events.id), // для повторяющихся событий
  reminderMinutes: integer('reminder_minutes').notNull().default(60),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Новая таблица: event_participants
export const eventParticipants = pgTable('event_participants', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, declined
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Новая таблица: invitations
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  inviterId: integer('inviter_id').notNull().references(() => users.id),
  inviteeId: integer('invitee_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, declined
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Новая таблица: notification_settings
export const notificationSettings = pgTable('notification_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  eventReminders: boolean('event_reminders').notNull().default(true),
  invitationNotifications: boolean('invitation_notifications').notNull().default(true),
  connectionNotifications: boolean('connection_notifications').notNull().default(true),
  reminderNotifications: boolean('reminder_notifications').notNull().default(true),
  defaultReminderMinutes: integer('default_reminder_minutes').notNull().default(60),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Обновление таблицы contacts
export const contacts = pgTable('contacts', {
  // ... существующие поля ...
  linkedUserId: integer('linked_user_id').references(() => users.id), // ID пользователя в системе
  isMutual: boolean('is_mutual').notNull().default(false) // взаимная связь
})
```

### API Endpoints

#### Events API

```typescript
// POST /api/events - создание события
interface CreateEventRequest {
  title: string
  type: 'meeting' | 'call' | 'trip' | 'other'
  customType?: string
  description?: string
  startDate: string // ISO date
  duration: number // минуты
  isRecurring: boolean
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom'
  recurrenceInterval?: number
  reminderMinutes?: number
  participantContactIds?: number[]
}

// GET /api/events - список событий пользователя
// GET /api/events/[id] - детали события
// PUT /api/events/[id] - обновление события
// DELETE /api/events/[id] - удаление события
// POST /api/events/[id]/cancel - отмена события
```

#### Invitations API

```typescript
// GET /api/invitations - список приглашений пользователя
// POST /api/invitations/[id]/respond - ответ на приглашение
interface RespondInvitationRequest {
  status: 'accepted' | 'declined'
}
```

#### Connections API

```typescript
// GET /api/connections/added-by - кто добавил текущего пользователя
// GET /api/connections/mutual - взаимные связи
```

#### Notifications API

```typescript
// GET /api/notifications/settings - настройки уведомлений
// PUT /api/notifications/settings - обновление настроек
```

### Frontend Components

#### EventCard Component

```vue
<template>
  <div class="bg-backgroundSecondary rounded-2xl p-4 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <span class="text-xl">{{ typeIcon }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-text truncate">{{ event.title }}</h3>
        <p class="text-sm text-textSecondary">{{ formattedDate }}</p>
      </div>
      <div class="flex items-center gap-1">
        <div class="flex -space-x-2">
          <!-- Аватары участников -->
        </div>
        <span class="text-xs text-textSecondary">+{{ participantCount }}</span>
      </div>
    </div>
  </div>
</template>
```

#### LinkedBadge Component

```vue
<template>
  <div 
    class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full 
           flex items-center justify-center border-2 border-white"
    :title="isMutual ? 'Взаимная связь' : 'В системе'"
  >
    <svg v-if="isMutual" class="w-2.5 h-2.5 text-white" ...>
      <!-- Иконка взаимной связи -->
    </svg>
    <svg v-else class="w-2.5 h-2.5 text-white" ...>
      <!-- Иконка "в системе" -->
    </svg>
  </div>
</template>
```

#### CalendarModal Component

```vue
<template>
  <Teleport to="body">
    <Transition name="modal-backdrop">
      <div v-if="isOpen" class="fixed inset-0 bg-black/50 z-50">
        <div class="bg-white rounded-t-3xl h-[85vh] mt-[15vh]">
          <!-- Заголовок с навигацией по месяцам -->
          <header class="p-4 border-b flex items-center justify-between">
            <button @click="prevMonth">←</button>
            <h2 class="font-bold">{{ currentMonthName }}</h2>
            <button @click="nextMonth">→</button>
          </header>
          
          <!-- Сетка календаря -->
          <div class="grid grid-cols-7 gap-1 p-4">
            <!-- Дни недели -->
            <!-- Дни месяца с индикаторами событий -->
          </div>
          
          <!-- События выбранного дня -->
          <div class="p-4 border-t">
            <h3 class="font-semibold mb-2">События на {{ selectedDate }}</h3>
            <div class="space-y-2">
              <EventCard v-for="event in selectedDayEvents" :event="event" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
```

### Home Page Layout Update

```
┌─────────────────────────────────────────┐
│  Header: Аватар | Приветствие | 🔔 📅   │
├─────────────────────────────────────────┤
│  Stats Cards: Контакты | Стрик | Уровень│
├─────────────────────────────────────────┤
│  📅 Ближайшие события (горизонтальный  │
│     скролл карточек событий)            │
├─────────────────────────────────────────┤
│  ⏰ Напоминания на сегодня              │
│     (вертикальный список)               │
├─────────────────────────────────────────┤
│  🚀 Быстрые действия                    │
└─────────────────────────────────────────┘
```

### Notification Service

```typescript
// server/utils/notifications.ts
export class NotificationService {
  private botToken: string
  
  async sendEventReminder(userId: number, event: Event): Promise<boolean>
  async sendInvitation(inviteeId: number, event: Event, inviter: User): Promise<boolean>
  async sendInvitationResponse(organizerId: number, event: Event, responder: User, accepted: boolean): Promise<boolean>
  async sendEventCancellation(participantId: number, event: Event): Promise<boolean>
  async sendConnectionNotification(userId: number, addedBy: User): Promise<boolean>
  
  private async sendTelegramMessage(telegramId: string, message: string): Promise<boolean>
  private async retryWithBackoff(fn: () => Promise<boolean>, maxRetries: number): Promise<boolean>
}
```

## Data Models

### Event Types

```typescript
interface Event {
  id: number
  organizerId: number
  title: string
  type: 'meeting' | 'call' | 'trip' | 'other'
  customType?: string
  description?: string
  startDate: Date
  endDate: Date
  duration: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  isRecurring: boolean
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'custom'
  recurrenceInterval?: number
  parentEventId?: number
  reminderMinutes: number
  participants: EventParticipant[]
  createdAt: Date
  updatedAt: Date
}

interface EventParticipant {
  id: number
  eventId: number
  contactId: number
  contact: Contact
  status: 'pending' | 'accepted' | 'declined'
  respondedAt?: Date
}

interface Invitation {
  id: number
  eventId: number
  event: Event
  inviterId: number
  inviter: User
  inviteeId: number
  status: 'pending' | 'accepted' | 'declined'
  respondedAt?: Date
  createdAt: Date
}

interface NotificationSettings {
  id: number
  userId: number
  eventReminders: boolean
  invitationNotifications: boolean
  connectionNotifications: boolean
  reminderNotifications: boolean
  defaultReminderMinutes: number
}
```

### Contact Extensions

```typescript
interface Contact {
  // ... существующие поля ...
  linkedUserId?: number  // ID пользователя в системе (если есть)
  linkedUser?: User      // Связанный пользователь
  isMutual: boolean      // Взаимная связь
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Contact linking consistency
*For any* contact added with a telegramContactId, if that telegramContactId exists in the users table, the contact's linkedUserId SHALL be set to that user's id.
**Validates: Requirements 1.1, 1.4**

### Property 2: Linked contact indicator presence
*For any* contact with a non-null linkedUserId, the rendered contact card and profile SHALL include the linked badge indicator.
**Validates: Requirements 1.2, 1.3**

### Property 3: Added-by list correctness
*For any* user U, the "added by" list SHALL contain exactly those users who have a contact record with linkedUserId equal to U's id.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 4: Mutual connection symmetry
*For any* two users A and B, if A has a contact with linkedUserId=B.id AND B has a contact with linkedUserId=A.id, then both contacts SHALL have isMutual=true.
**Validates: Requirements 2.4, 3.1, 3.3**

### Property 5: Mutual filter correctness
*For any* contacts list filtered by "mutual only", all returned contacts SHALL have isMutual=true and no contacts with isMutual=false SHALL be included.
**Validates: Requirements 3.2**

### Property 6: Event creation validation
*For any* event creation request, the event SHALL be created only if: title is non-empty, type is valid, startDate is in the future, and duration is between 15 and 1440 minutes.
**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

### Property 7: Custom event type requirement
*For any* event with type="other", the customType field SHALL be non-empty; for events with other types, customType MAY be null.
**Validates: Requirements 4.3**

### Property 8: Recurrence pattern validation
*For any* recurring event, recurrencePattern SHALL be one of: daily, weekly, monthly, custom; and if pattern is "custom", recurrenceInterval SHALL be a positive integer.
**Validates: Requirements 5.1, 5.2**

### Property 9: Recurrence generation correctness
*For any* recurring event with pattern P and interval I, generated instances SHALL have startDates that follow the pattern (e.g., weekly = 7 days apart).
**Validates: Requirements 5.3**

### Property 10: Participant invitation logic
*For any* participant added to an event, if the participant's contact has linkedUserId, an invitation record SHALL be created; otherwise, no invitation SHALL be created.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 11: Invitation response synchronization
*For any* invitation that is accepted or declined, the corresponding eventParticipant record SHALL have the same status.
**Validates: Requirements 7.3, 7.4**

### Property 12: Pending invitations query
*For any* user, the pending invitations list SHALL contain exactly those invitations where inviteeId equals the user's id AND status equals "pending".
**Validates: Requirements 7.1**

### Property 13: Event status transitions
*For any* event, status SHALL transition: scheduled → in_progress (when now >= startDate), in_progress → completed (when now >= endDate), and cancelled is a terminal state.
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 14: Event organizer authorization
*For any* event status change request, the change SHALL succeed only if the requester is the event organizer.
**Validates: Requirements 8.4**

### Property 15: Upcoming events filter
*For any* upcoming events query, all returned events SHALL have startDate within the next 7 days and status not equal to "cancelled" or "completed".
**Validates: Requirements 9.5**

### Property 16: Calendar day events
*For any* selected date D in the calendar, the displayed events SHALL be exactly those where startDate falls on day D.
**Validates: Requirements 10.3, 10.5**

### Property 17: Event card rendering
*For any* event card, the rendered output SHALL contain the event title, formatted date/time, and participant count.
**Validates: Requirements 9.3**

### Property 18: Reminder time calculation
*For any* event with reminderMinutes=M, the reminder notification SHALL be scheduled for (startDate - M minutes).
**Validates: Requirements 11.2**

### Property 19: Notification settings persistence
*For any* user, there SHALL be at most one notification_settings record, and updates SHALL preserve all fields not explicitly changed.
**Validates: Requirements 11.4, 12.1, 12.2, 12.3**

### Property 20: Notification preference respect
*For any* notification type T, if the user's settings have T disabled, no notification of type T SHALL be sent to that user.
**Validates: Requirements 12.4**

### Property 21: Notification retry logic
*For any* failed notification attempt, the system SHALL retry up to 3 times before marking as failed.
**Validates: Requirements 11.6**


## Error Handling

### Database Errors
- Connection failures: Retry with exponential backoff, return 503 after 3 attempts
- Constraint violations: Return 400 with descriptive message
- Not found: Return 404 with entity type

### Validation Errors
- Invalid event dates: "Дата события должна быть в будущем"
- Invalid duration: "Продолжительность должна быть от 15 минут до 24 часов"
- Missing required fields: "Поле {field} обязательно"
- Invalid recurrence: "Укажите интервал повторения"

### Authorization Errors
- Not event organizer: "Только организатор может изменить событие"
- Not invitation recipient: "Приглашение не найдено"

### Notification Errors
- Telegram API failure: Log error, retry up to 3 times
- User not found: Skip notification, log warning
- Bot blocked by user: Mark user as notification-disabled

## Testing Strategy

### Unit Tests
- Event validation functions
- Recurrence date generation
- Reminder time calculation
- Mutual connection detection
- Filter functions (upcoming events, pending invitations)

### Property-Based Tests (using fast-check)
- **Property 1**: Contact linking - generate random contacts and users, verify linking
- **Property 4**: Mutual symmetry - generate connection pairs, verify both marked mutual
- **Property 6**: Event validation - generate random event data, verify validation rules
- **Property 9**: Recurrence generation - generate patterns, verify date sequences
- **Property 13**: Status transitions - generate event timelines, verify state machine
- **Property 15**: Upcoming filter - generate events with various dates, verify filter
- **Property 18**: Reminder calculation - generate events with reminder settings, verify times

### Integration Tests
- Event CRUD operations
- Invitation flow (create → respond → sync)
- Notification delivery (mock Telegram API)
- Calendar queries

### Configuration
- Minimum 100 iterations per property test
- Tag format: **Feature: social-events-notifications, Property {N}: {title}**
