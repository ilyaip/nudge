import { pgTable, serial, varchar, integer, boolean, timestamp, text, jsonb } from 'drizzle-orm/pg-core'

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  totalXP: integer('total_xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  lastActivityDate: timestamp('last_activity_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Contacts table
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  telegramContactId: varchar('telegram_contact_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  username: varchar('username', { length: 255 }),
  isTracked: boolean('is_tracked').notNull().default(false),
  frequency: varchar('frequency', { length: 50 }).notNull().default('monthly'),
  customFrequencyDays: integer('custom_frequency_days'),
  communicationType: varchar('communication_type', { length: 50 }).notNull().default('message'),
  category: varchar('category', { length: 50 }).notNull().default('friends'),
  lastContactDate: timestamp('last_contact_date'),
  nextReminderDate: timestamp('next_reminder_date'),
  // Social connections fields
  linkedUserId: integer('linked_user_id').references(() => users.id),
  isMutual: boolean('is_mutual').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Reminders table
export const reminders = pgTable('reminders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date').notNull(),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  notificationSent: boolean('notification_sent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Achievements table
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 100 }).notNull(),
  xpReward: integer('xp_reward').notNull().default(0),
  criteria: jsonb('criteria').notNull()
})

// User achievements table
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: integer('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').notNull().defaultNow()
})

// Activity logs table
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  xpAwarded: integer('xp_awarded').notNull().default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Events table
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
  parentEventId: integer('parent_event_id'), // для повторяющихся событий
  reminderMinutes: integer('reminder_minutes').notNull().default(60),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Event participants table
export const eventParticipants = pgTable('event_participants', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  contactId: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, declined
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Invitations table
export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  inviterId: integer('inviter_id').notNull().references(() => users.id),
  inviteeId: integer('invitee_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, declined
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

// Notification settings table
export const notificationSettings = pgTable('notification_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventReminders: boolean('event_reminders').notNull().default(true),
  invitationNotifications: boolean('invitation_notifications').notNull().default(true),
  connectionNotifications: boolean('connection_notifications').notNull().default(true),
  reminderNotifications: boolean('reminder_notifications').notNull().default(true),
  defaultReminderMinutes: integer('default_reminder_minutes').notNull().default(60),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Type exports for use in application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert

export type Reminder = typeof reminders.$inferSelect
export type NewReminder = typeof reminders.$inferInsert

export type Achievement = typeof achievements.$inferSelect
export type NewAchievement = typeof achievements.$inferInsert

export type UserAchievement = typeof userAchievements.$inferSelect
export type NewUserAchievement = typeof userAchievements.$inferInsert

export type ActivityLog = typeof activityLogs.$inferSelect
export type NewActivityLog = typeof activityLogs.$inferInsert

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert

export type EventParticipant = typeof eventParticipants.$inferSelect
export type NewEventParticipant = typeof eventParticipants.$inferInsert

export type Invitation = typeof invitations.$inferSelect
export type NewInvitation = typeof invitations.$inferInsert

export type NotificationSetting = typeof notificationSettings.$inferSelect
export type NewNotificationSetting = typeof notificationSettings.$inferInsert
