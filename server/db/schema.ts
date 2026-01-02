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
