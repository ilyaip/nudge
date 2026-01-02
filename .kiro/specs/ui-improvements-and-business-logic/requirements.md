# Requirements Document: UI Improvements and Business Logic Fixes

## Introduction

Эта спека описывает доработки приложения Nudge для исправления бизнес-логики геймификации и обновления дизайна в соответствии с современным стилем E-Wallet приложения. Основные цели: сделать геймификацию полностью функциональной и улучшить визуальный опыт пользователей.

## Glossary

- **System**: Приложение Nudge (Telegram Mini App)
- **Dashboard**: Главная страница приложения
- **Gamification**: Система геймификации (XP, уровни, streak, достижения)
- **Reminder**: Напоминание о необходимости связаться с контактом
- **UI**: Пользовательский интерфейс
- **Design_System**: Набор цветов, компонентов и стилей

## Requirements

### Requirement 1: Исправление геймификации при завершении напоминания

**User Story:** As a user, I want to earn XP, update my streak, and unlock achievements when I complete a reminder, so that I feel rewarded for maintaining my connections.

#### Acceptance Criteria

1. WHEN a user completes a reminder, THE System SHALL call `updateStreak(userId)` to update the user's streak
2. WHEN a user completes a reminder, THE System SHALL call `awardXP(userId, 'REMINDER_COMPLETED')` to award 20 XP
3. WHEN a user completes a reminder, THE System SHALL call `checkAchievements(userId)` to check for newly unlocked achievements
4. WHEN a user completes a reminder, THE System SHALL return earned XP and streak information in the API response
5. WHEN XP is awarded, THE System SHALL create an activity log entry with action='REMINDER_COMPLETED'

### Requirement 2: Обновление UI после завершения напоминания

**User Story:** As a user, I want to see my statistics update immediately after completing a reminder, so that I can track my progress in real-time.

#### Acceptance Criteria

1. WHEN a user completes a reminder, THE System SHALL update the XP counter on Dashboard immediately
2. WHEN a user completes a reminder, THE System SHALL update the level and progress bar immediately
3. WHEN a user completes a reminder, THE System SHALL update the streak counter immediately
4. WHEN a user completes a reminder, THE System SHALL show a success notification with earned XP
5. WHEN a user completes a reminder, THE System SHALL remove it from the active reminders list with fade-out animation

### Requirement 3: Новая цветовая схема (фиолетовая)

**User Story:** As a user, I want a modern and visually appealing interface, so that using the app is enjoyable.

#### Acceptance Criteria

1. THE System SHALL use primary color #6B3CE9 (фиолетовый) for main UI elements
2. THE System SHALL use dark color #1A0B2E (темно-фиолетовый) for dark cards and backgrounds
3. THE System SHALL use accent color #8B5CF6 (светло-фиолетовый) for highlights and hover states
4. THE System SHALL use white #FFFFFF for main background
5. THE System SHALL use #F8F9FA for secondary backgrounds

### Requirement 4: Обновление Dashboard дизайна

**User Story:** As a user, I want an attractive Dashboard that clearly shows my progress, so that I stay motivated.

#### Acceptance Criteria

1. THE System SHALL display a purple gradient header with user's XP/level prominently
2. THE System SHALL display streak and level cards with gradient backgrounds (dark purple and bright purple)
3. THE System SHALL use larger, bolder typography for key metrics
4. THE System SHALL display reminder cards with contact avatars or category icons
5. THE System SHALL use rounded corners (20px border-radius) for all cards

### Requirement 5: Улучшение карточек напоминаний

**User Story:** As a user, I want reminder cards to be visually clear and easy to interact with, so that I can quickly complete my tasks.

#### Acceptance Criteria

1. WHEN displaying a reminder, THE System SHALL show a circular avatar or category icon (56px diameter)
2. WHEN displaying a reminder, THE System SHALL use larger font (18px) for contact names
3. WHEN displaying a reminder, THE System SHALL show secondary information in gray color
4. WHEN displaying a reminder, THE System SHALL show a purple "Готово" button with rounded corners
5. WHEN a reminder is completed, THE System SHALL animate the card fading out

### Requirement 6: Обновление страницы контактов

**User Story:** As a user, I want the contacts page to be clean and easy to navigate, so that I can quickly find and manage my contacts.

#### Acceptance Criteria

1. THE System SHALL display circular avatars (56px) for each contact
2. THE System SHALL use white background with subtle shadows for cards
3. THE System SHALL display contact names in bold (16px font)
4. THE System SHALL display secondary information (username, category) in gray
5. THE System SHALL use purple color for the "Добавить" button

### Requirement 7: Улучшение страницы достижений

**User Story:** As a user, I want achievements to look rewarding and celebratory, so that I feel proud of my accomplishments.

#### Acceptance Criteria

1. WHEN displaying unlocked achievements, THE System SHALL use gradient backgrounds (yellow-to-orange or purple)
2. WHEN displaying locked achievements, THE System SHALL use grayscale with reduced opacity
3. WHEN displaying achievement progress, THE System SHALL show a purple gradient progress bar
4. WHEN an achievement is unlocked, THE System SHALL show a celebration animation
5. THE System SHALL display achievement icons at 48px size

### Requirement 8: Улучшение графика активности

**User Story:** As a user, I want to see my activity visualized clearly, so that I understand my communication patterns.

#### Acceptance Criteria

1. THE System SHALL display activity as a bar chart with purple bars
2. WHEN hovering over a bar, THE System SHALL show detailed information for that day
3. WHEN data updates, THE System SHALL animate the bars growing/shrinking
4. THE System SHALL use color intensity to indicate activity level (darker = more activity)
5. THE System SHALL display the chart with clean, minimal styling

### Requirement 9: Добавление анимаций и transitions

**User Story:** As a user, I want smooth animations and transitions, so that the app feels polished and responsive.

#### Acceptance Criteria

1. WHEN a card appears, THE System SHALL fade it in with 300ms duration
2. WHEN a card is removed, THE System SHALL fade it out with 300ms duration
3. WHEN hovering over interactive elements, THE System SHALL show a subtle scale or shadow effect
4. WHEN progress bars update, THE System SHALL animate the fill with 500ms duration
5. WHEN buttons are clicked, THE System SHALL show a ripple or press effect

### Requirement 10: Улучшение уведомлений

**User Story:** As a user, I want clear and attractive notifications, so that I understand what happened.

#### Acceptance Criteria

1. WHEN showing a success notification, THE System SHALL use green background with white text
2. WHEN showing an error notification, THE System SHALL use red background with white text
3. WHEN showing XP earned, THE System SHALL display "+{amount} XP" with a sparkle icon
4. WHEN an achievement is unlocked, THE System SHALL show a special celebration notification
5. THE System SHALL auto-dismiss notifications after 3 seconds

