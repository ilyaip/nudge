# Requirements Document

## Introduction

Nudge — это Telegram Mini App, который помогает пользователям поддерживать важные социальные и профессиональные связи через умные напоминания и геймификацию. Приложение анализирует частоту общения с контактами, импортированными из Telegram, и мотивирует пользователей регулярно поддерживать связь.

## Glossary

- **Nudge_App**: Telegram Mini App для управления социальными связями
- **User**: Пользователь Telegram, использующий Nudge App
- **Contact**: Контакт из Telegram, за которым пользователь хочет "следить"
- **Reminder**: Напоминание о необходимости связаться с контактом
- **Streak**: Серия последовательных дней выполнения напоминаний
- **XP**: Очки опыта, начисляемые за активность
- **Achievement**: Достижение, получаемое за выполнение определенных условий
- **Communication_Frequency**: Желаемая частота связи с контактом
- **Telegram_Bot**: Бот, отправляющий уведомления пользователю
- **Dashboard**: Главная страница приложения с виджетами и прогрессом

## Requirements

### Requirement 1: Telegram Integration

**User Story:** As a user, I want to authorize through Telegram and import my contacts, so that I can start managing my social connections.

#### Acceptance Criteria

1. WHEN a user opens the Mini App, THE Nudge_App SHALL authenticate the user using Telegram Web App initData
2. WHEN authentication is successful, THE Nudge_App SHALL validate the initData on the backend to ensure security
3. WHEN a user requests to import contacts, THE Nudge_App SHALL retrieve the user's Telegram chat list with user consent
4. WHEN contacts are imported, THE Nudge_App SHALL store contact information including name, username, and last interaction date
5. IF authentication fails, THEN THE Nudge_App SHALL display an error message and prevent access to the application

### Requirement 2: Contact Management

**User Story:** As a user, I want to view and configure my imported contacts, so that I can customize how I want to maintain each relationship.

#### Acceptance Criteria

1. WHEN a user navigates to the contacts page, THE Nudge_App SHALL display a list of all imported contacts
2. WHEN a user selects a contact, THE Nudge_App SHALL allow the user to mark it for tracking
3. WHEN a user configures a tracked contact, THE Nudge_App SHALL allow setting communication frequency from predefined options (weekly, monthly, quarterly)
4. WHEN a user configures a tracked contact, THE Nudge_App SHALL allow setting communication type (message, call, meeting)
5. WHEN a user configures a tracked contact, THE Nudge_App SHALL allow assigning a category (Family, Friends, Colleagues, Business)
6. WHEN a user updates contact settings, THE Nudge_App SHALL persist the changes to the database immediately
7. WHEN a user views a contact detail page, THE Nudge_App SHALL display interaction history and allow manual updates of last contact date

### Requirement 3: Reminder System

**User Story:** As a user, I want to receive timely reminders to contact people, so that I don't forget to maintain important relationships.

#### Acceptance Criteria

1. WHEN the system calculates reminders, THE Nudge_App SHALL determine due contacts based on configured frequency and last interaction date
2. WHEN a contact is due for communication, THE Nudge_App SHALL add it to today's reminder list
3. WHEN reminders are ready, THE Telegram_Bot SHALL send notification messages to the user
4. WHEN a user opens the Dashboard, THE Nudge_App SHALL display a widget showing contacts to reach out to today
5. WHEN a user marks a reminder as completed, THE Nudge_App SHALL update the last interaction date for that contact
6. WHEN a user marks a reminder as completed, THE Nudge_App SHALL remove the contact from today's reminder list

### Requirement 4: Gamification System

**User Story:** As a user, I want to see my progress and earn rewards, so that I stay motivated to maintain my social connections.

#### Acceptance Criteria

1. WHEN a user completes a reminder, THE Nudge_App SHALL increment the user's current streak by one day
2. IF a user misses a day without completing any reminders, THEN THE Nudge_App SHALL reset the streak to zero
3. WHEN a user performs tracked actions, THE Nudge_App SHALL award XP points according to predefined rules
4. WHEN a user adds a contact, THE Nudge_App SHALL award XP points
5. WHEN a user completes a reminder, THE Nudge_App SHALL award XP points
6. WHEN a user maintains a streak, THE Nudge_App SHALL award bonus XP points
7. WHEN a user accumulates sufficient XP, THE Nudge_App SHALL increase the user's level
8. WHEN a user meets achievement criteria, THE Nudge_App SHALL unlock the corresponding achievement
9. WHEN a user views the Dashboard, THE Nudge_App SHALL display current streak, XP, level, and progress bar
10. WHEN a user navigates to the achievements page, THE Nudge_App SHALL display all achievements with locked and unlocked states

### Requirement 5: Progress Visualization

**User Story:** As a user, I want to see visual representations of my activity, so that I can understand my communication patterns.

#### Acceptance Criteria

1. WHEN a user views the Dashboard, THE Nudge_App SHALL display a graph or chart showing activity over weeks or months
2. WHEN a user views activity visualization, THE Nudge_App SHALL show the number of completed reminders per time period
3. WHEN a user views the achievements page, THE Nudge_App SHALL display progress toward locked achievements

### Requirement 6: Data Persistence

**User Story:** As a system administrator, I want all user data to be reliably stored, so that users don't lose their progress and settings.

#### Acceptance Criteria

1. WHEN user data is modified, THE Nudge_App SHALL persist changes to the database immediately
2. WHEN a user closes and reopens the application, THE Nudge_App SHALL restore all user data including contacts, settings, streaks, XP, and achievements
3. WHEN database operations fail, THE Nudge_App SHALL log errors and display appropriate error messages to the user

### Requirement 7: Notification Scheduling

**User Story:** As a system, I want to automatically schedule and send reminders, so that users receive timely notifications without manual intervention.

#### Acceptance Criteria

1. WHEN the scheduler runs, THE Nudge_App SHALL calculate which contacts are due for reminders based on current date and contact settings
2. WHEN reminders are calculated, THE Nudge_App SHALL send notification requests to the Telegram Bot
3. WHEN the Telegram Bot receives notification requests, THE Telegram_Bot SHALL send messages to the appropriate users
4. WHEN notifications are sent, THE Nudge_App SHALL log the notification event

### Requirement 8: User Interface

**User Story:** As a user, I want an intuitive and responsive interface, so that I can easily navigate and use the application.

#### Acceptance Criteria

1. WHEN a user navigates between pages, THE Nudge_App SHALL provide smooth transitions and maintain application state
2. WHEN a user interacts with UI elements, THE Nudge_App SHALL provide immediate visual feedback
3. WHEN the application loads data, THE Nudge_App SHALL display loading indicators
4. WHEN errors occur, THE Nudge_App SHALL display user-friendly error messages
5. WHEN a user views the application on different screen sizes, THE Nudge_App SHALL adapt the layout responsively

### Requirement 9: Bot Webhook Integration

**User Story:** As a developer, I want the Telegram Bot to communicate with the backend, so that the system can process bot commands and update user data.

#### Acceptance Criteria

1. WHEN the Telegram Bot receives a command from a user, THE Telegram_Bot SHALL send a webhook request to the Nudge App backend
2. WHEN the backend receives a webhook request, THE Nudge_App SHALL validate the request authenticity
3. WHEN a user sends a completion command to the bot, THE Nudge_App SHALL mark the corresponding reminder as completed
4. IF webhook validation fails, THEN THE Nudge_App SHALL reject the request and log the security event
