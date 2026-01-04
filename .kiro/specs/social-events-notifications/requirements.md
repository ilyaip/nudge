# Requirements Document

## Introduction

Расширение функционала приложения Nudge для поддержки социальных связей между пользователями, системы событий с приглашениями и push-уведомлений через Telegram бота. Это превращает приложение из простого трекера контактов в полноценную социальную платформу для планирования встреч и поддержания связей.

## Glossary

- **System**: Приложение Nudge
- **User**: Авторизованный пользователь приложения
- **Contact**: Контакт, добавленный пользователем (может быть или не быть в системе)
- **Linked_Contact**: Контакт, который также является авторизованным пользователем системы
- **Event**: Событие (встреча, звонок, поездка и т.д.) с датой, временем и участниками
- **Event_Participant**: Участник события (контакт, приглашённый в событие)
- **Invitation**: Приглашение в событие для пользователя системы
- **Mutual_Connection**: Взаимная связь, когда оба пользователя добавили друг друга
- **Notification_Service**: Сервис отправки уведомлений через Telegram бота
- **Calendar_View**: Визуальное представление событий в формате календаря

## Requirements

### Requirement 1: Определение связанных пользователей

**User Story:** As a user, I want to see which of my contacts are also using the app, so that I can invite them to events and see mutual connections.

#### Acceptance Criteria

1. WHEN a contact is added, THE System SHALL check if the contact's Telegram ID exists in the users table
2. WHEN a contact is a Linked_Contact, THE System SHALL display a visual indicator (badge) on the contact's avatar
3. WHEN viewing a contact's profile, THE System SHALL show the linked status with appropriate indicator
4. THE System SHALL update the linked status when a contact registers in the system

### Requirement 2: Список добавивших пользователей

**User Story:** As a user, I want to see who added me as a contact, so that I can be aware of my connections and add them back.

#### Acceptance Criteria

1. THE System SHALL provide a section showing users who added the current user as a contact
2. WHEN a user is added by someone, THE System SHALL notify them via the "added by" list
3. WHEN viewing the "added by" list, THE System SHALL show the user's name, avatar, and option to add back
4. WHEN both users add each other, THE System SHALL mark the connection as Mutual_Connection

### Requirement 3: Взаимные связи

**User Story:** As a user, I want to see mutual connections, so that I can identify close relationships.

#### Acceptance Criteria

1. WHEN both users have added each other, THE System SHALL display a mutual connection indicator
2. THE System SHALL provide a filter to view only mutual connections in the contacts list
3. WHEN a mutual connection is established, THE System SHALL update both users' contact records

### Requirement 4: Создание событий

**User Story:** As a user, I want to create events with specific details, so that I can plan meetings and activities.

#### Acceptance Criteria

1. THE System SHALL allow creating events with: title, type, date, time, duration, and description
2. THE System SHALL provide predefined event types: встреча, звонок, поездка, другое
3. THE System SHALL allow custom event type names when "другое" is selected
4. THE System SHALL validate that event date/time is in the future
5. THE System SHALL support event durations from 15 minutes to 24 hours
6. WHEN the "+" button in navigation is pressed, THE System SHALL open the event creation form

### Requirement 5: Повторяющиеся события

**User Story:** As a user, I want to create recurring events, so that I don't have to manually create regular meetings.

#### Acceptance Criteria

1. THE System SHALL support recurrence patterns: daily, weekly, monthly, custom
2. WHEN custom recurrence is selected, THE System SHALL allow specifying interval in days
3. THE System SHALL generate future event instances based on recurrence pattern
4. THE System SHALL allow editing single instance or all instances of recurring events

### Requirement 6: Приглашение участников в события

**User Story:** As a user, I want to invite contacts to my events, so that we can coordinate activities together.

#### Acceptance Criteria

1. THE System SHALL allow adding contacts as event participants
2. WHEN a participant is a Linked_Contact, THE System SHALL send them an invitation notification
3. WHEN a participant is not in the system, THE System SHALL add them to the participant list without notification
4. THE System SHALL display participant status: pending, accepted, declined (for Linked_Contacts)
5. THE System SHALL allow removing participants from events

### Requirement 7: Управление приглашениями

**User Story:** As a user, I want to respond to event invitations, so that organizers know my attendance status.

#### Acceptance Criteria

1. THE System SHALL show pending invitations to the user
2. WHEN an invitation is received, THE System SHALL notify the user via Telegram bot
3. THE System SHALL allow accepting or declining invitations
4. WHEN an invitation is responded to, THE System SHALL update the participant status
5. WHEN an invitation is responded to, THE System SHALL notify the event organizer

### Requirement 8: Статусы событий

**User Story:** As a user, I want to track event status, so that I can manage my schedule effectively.

#### Acceptance Criteria

1. THE System SHALL support event statuses: scheduled, in_progress, completed, cancelled
2. THE System SHALL automatically update status to in_progress when event time arrives
3. THE System SHALL automatically update status to completed when event duration ends
4. THE System SHALL allow manual status changes by the event organizer
5. WHEN an event is cancelled, THE System SHALL notify all participants

### Requirement 9: Отображение событий на главной странице

**User Story:** As a user, I want to see my upcoming events on the home page, so that I can quickly check my schedule.

#### Acceptance Criteria

1. THE System SHALL display upcoming events in a dedicated section on the home page
2. THE System SHALL separate events from reminders visually
3. THE System SHALL show event title, date/time, and participant count
4. THE System SHALL allow quick access to event details from the home page
5. THE System SHALL show events for the next 7 days by default

### Requirement 10: Календарь событий

**User Story:** As a user, I want to view my events in a calendar format, so that I can see my schedule at a glance.

#### Acceptance Criteria

1. WHEN the notification icon on the home page is pressed, THE System SHALL open the Calendar_View
2. THE Calendar_View SHALL display events by day/week/month
3. THE Calendar_View SHALL highlight days with events
4. THE System SHALL allow navigating between months in the calendar
5. WHEN a day is selected, THE System SHALL show events for that day

### Requirement 11: Push-уведомления через Telegram

**User Story:** As a user, I want to receive notifications about reminders and events, so that I don't miss important activities.

#### Acceptance Criteria

1. THE Notification_Service SHALL send messages via Telegram bot
2. THE System SHALL send event reminders at configurable time before event (default: 1 hour)
3. THE System SHALL send notifications for: event invitations, invitation responses, event cancellations
4. THE System SHALL allow users to configure notification preferences
5. THE System SHALL send reminder notifications for contact check-ins (existing functionality)
6. IF a notification fails to send, THEN THE System SHALL retry up to 3 times

### Requirement 12: Настройки уведомлений

**User Story:** As a user, I want to configure my notification preferences, so that I receive relevant notifications at appropriate times.

#### Acceptance Criteria

1. THE System SHALL allow setting default reminder time before events (15min, 30min, 1hour, 1day)
2. THE System SHALL allow enabling/disabling notification types separately
3. THE System SHALL store notification preferences per user
4. THE System SHALL respect user's notification preferences when sending notifications

### Requirement 13: Адаптивный UI

**User Story:** As a user, I want the new features to match the existing app design, so that the experience is consistent.

#### Acceptance Criteria

1. THE System SHALL use the existing color scheme (primary purple, backgrounds, text colors)
2. THE System SHALL use Inter font family consistently
3. THE System SHALL ensure all new components are mobile-responsive
4. THE System SHALL use existing UI patterns (rounded corners, shadows, transitions)
5. THE System SHALL ensure no horizontal overflow on mobile devices
6. THE System SHALL use animations under 300ms for smooth experience
