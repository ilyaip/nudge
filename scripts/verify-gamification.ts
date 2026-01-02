#!/usr/bin/env tsx
/**
 * Script to verify gamification functionality
 * Checks if activity logs are created when reminders are completed
 */

// Set DATABASE_URL for local development
process.env.DATABASE_URL = 'postgresql://nudge_user:nudge_password@localhost:5432/nudge'

import { db } from '../server/db'
import { activityLogs, users, reminders } from '../server/db/schema'
import { desc, eq } from 'drizzle-orm'

async function verifyGamification() {
  console.log('🔍 Verifying Gamification Functionality\n')
  
  try {
    // Get all users
    const allUsers = await db.select().from(users)
    console.log(`📊 Total users in database: ${allUsers.length}\n`)
    
    if (allUsers.length === 0) {
      console.log('⚠️  No users found. Please create a user first.')
      return
    }
    
    // For each user, show their stats and recent activity
    for (const user of allUsers) {
      console.log(`👤 User: ${user.firstName || 'Unknown'} (ID: ${user.id})`)
      console.log(`   Telegram ID: ${user.telegramId}`)
      console.log(`   Level: ${user.level}`)
      console.log(`   Total XP: ${user.totalXP}`)
      console.log(`   Current Streak: ${user.currentStreak}`)
      console.log(`   Longest Streak: ${user.longestStreak}`)
      console.log(`   Last Activity: ${user.lastActivityDate || 'Never'}`)
      
      // Get recent activity logs
      const recentActivity = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.userId, user.id))
        .orderBy(desc(activityLogs.createdAt))
        .limit(10)
      
      console.log(`\n   📝 Recent Activity Logs (${recentActivity.length} total):`)
      if (recentActivity.length === 0) {
        console.log('      No activity logs found.')
      } else {
        for (const log of recentActivity) {
          console.log(`      - ${log.action} (+${log.xpAwarded} XP) at ${log.createdAt}`)
          if (log.metadata) {
            console.log(`        Metadata: ${JSON.stringify(log.metadata)}`)
          }
        }
      }
      
      // Get reminders for this user
      const userReminders = await db
        .select()
        .from(reminders)
        .where(eq(reminders.userId, user.id))
      
      const completedReminders = userReminders.filter(r => r.completed)
      const pendingReminders = userReminders.filter(r => !r.completed)
      
      console.log(`\n   📋 Reminders:`)
      console.log(`      Total: ${userReminders.length}`)
      console.log(`      Completed: ${completedReminders.length}`)
      console.log(`      Pending: ${pendingReminders.length}`)
      
      if (completedReminders.length > 0) {
        console.log(`\n   ✅ Recently Completed Reminders:`)
        for (const reminder of completedReminders.slice(0, 5)) {
          console.log(`      - Reminder ID ${reminder.id} completed at ${reminder.completedAt}`)
        }
      }
      
      console.log('\n' + '='.repeat(80) + '\n')
    }
    
    // Summary
    const totalActivityLogs = await db.select().from(activityLogs)
    console.log(`\n📊 Summary:`)
    console.log(`   Total activity logs in database: ${totalActivityLogs.length}`)
    console.log(`   Total users: ${allUsers.length}`)
    
    const reminderCompletedLogs = totalActivityLogs.filter(log => log.action === 'REMINDER_COMPLETED')
    console.log(`   Activity logs for REMINDER_COMPLETED: ${reminderCompletedLogs.length}`)
    
    if (reminderCompletedLogs.length > 0) {
      console.log('\n✅ Gamification is working! Activity logs are being created.')
    } else {
      console.log('\n⚠️  No REMINDER_COMPLETED activity logs found.')
      console.log('   Please complete a reminder in the app to test gamification.')
    }
    
  } catch (error) {
    console.error('❌ Error verifying gamification:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

// Run the verification
verifyGamification()
