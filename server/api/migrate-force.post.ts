// Принудительное применение миграции 0002 напрямую через SQL
import { db } from '../db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (body?.secret !== 'migrate-nudge-2026') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  console.log('[Force Migration] Starting...')

  try {
    // Добавляем колонки в contacts
    await db.execute(sql`
      ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "linked_user_id" integer;
    `)
    await db.execute(sql`
      ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "is_mutual" boolean DEFAULT false NOT NULL;
    `)
    console.log('[Force Migration] contacts columns added')

    // Создаём таблицу events
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" serial PRIMARY KEY NOT NULL,
        "organizer_id" integer NOT NULL,
        "title" varchar(255) NOT NULL,
        "type" varchar(50) NOT NULL,
        "custom_type" varchar(100),
        "description" text,
        "start_date" timestamp NOT NULL,
        "end_date" timestamp NOT NULL,
        "duration" integer NOT NULL,
        "status" varchar(20) DEFAULT 'scheduled' NOT NULL,
        "is_recurring" boolean DEFAULT false NOT NULL,
        "recurrence_pattern" varchar(20),
        "recurrence_interval" integer,
        "parent_event_id" integer,
        "reminder_minutes" integer DEFAULT 60 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('[Force Migration] events table created')

    // Создаём таблицу event_participants
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "event_participants" (
        "id" serial PRIMARY KEY NOT NULL,
        "event_id" integer NOT NULL,
        "contact_id" integer NOT NULL,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "responded_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('[Force Migration] event_participants table created')


    // Создаём таблицу invitations
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "invitations" (
        "id" serial PRIMARY KEY NOT NULL,
        "event_id" integer NOT NULL,
        "inviter_id" integer NOT NULL,
        "invitee_id" integer NOT NULL,
        "status" varchar(20) DEFAULT 'pending' NOT NULL,
        "responded_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `)
    console.log('[Force Migration] invitations table created')

    // Создаём таблицу notification_settings
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "notification_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "event_reminders" boolean DEFAULT true NOT NULL,
        "invitation_notifications" boolean DEFAULT true NOT NULL,
        "connection_notifications" boolean DEFAULT true NOT NULL,
        "reminder_notifications" boolean DEFAULT true NOT NULL,
        "default_reminder_minutes" integer DEFAULT 60 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
      );
    `)
    console.log('[Force Migration] notification_settings table created')

    // Добавляем foreign keys
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "contacts" ADD CONSTRAINT "contacts_linked_user_id_users_id_fk" 
        FOREIGN KEY ("linked_user_id") REFERENCES "users"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" 
        FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fk" 
        FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_contact_id_fk" 
        FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_event_id_fk" 
        FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_fk" 
        FOREIGN KEY ("inviter_id") REFERENCES "users"("id");
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitee_id_fk" 
        FOREIGN KEY ("invitee_id") REFERENCES "users"("id");
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)

    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `)
    console.log('[Force Migration] Foreign keys added')

    console.log('[Force Migration] ✅ Complete!')
    return { success: true, message: 'Force migration completed' }
  } catch (error: any) {
    console.error('[Force Migration] Error:', error)
    throw createError({ statusCode: 500, message: error.message })
  }
})
