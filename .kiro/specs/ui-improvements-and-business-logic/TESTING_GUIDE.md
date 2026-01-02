# Gamification Testing Guide

## Checkpoint 4: Testing Gamification Functionality

This guide will help you manually test the gamification features that were implemented in tasks 1-3.

## Prerequisites

1. **Start the development environment:**
   ```bash
   npm run dev
   ```

2. **Ensure database is running:**
   ```bash
   docker ps | grep postgres
   ```
   You should see the postgres container running.

3. **Open the app in Telegram:**
   - Open Telegram
   - Navigate to your bot
   - Open the Mini App

## Manual Testing Checklist

### Test 1: Complete a Reminder and Check XP Notification

**Steps:**
1. Open the Dashboard in the Telegram Mini App
2. Look for a reminder in the "Сегодняшние напоминания" section
3. Click the "✓ Готово" button on a reminder
4. **Expected Results:**
   - ✅ A success notification appears showing "+20 XP заработано!" with 🎉 emoji
   - ✅ The notification has the title "Отлично!"
   - ✅ The reminder disappears from the list (with fade-out animation if implemented)

**What to check:**
- [ ] Notification appeared?
- [ ] Notification shows "+20 XP"?
- [ ] Notification has celebration emoji?
- [ ] Reminder disappeared from list?

---

### Test 2: Check Dashboard Statistics Update

**Steps:**
1. After completing a reminder (from Test 1)
2. Look at the statistics cards on the Dashboard
3. **Expected Results:**
   - ✅ XP counter increased by 20
   - ✅ Level updated (if you earned enough XP)
   - ✅ Streak counter updated to 1 (or incremented if you already had a streak)
   - ✅ Progress bar to next level updated

**What to check:**
- [ ] XP updated on Dashboard?
- [ ] Level updated (if applicable)?
- [ ] Streak updated?
- [ ] Progress bar reflects new XP?

---

### Test 3: Check Achievement Unlocks

**Steps:**
1. Complete multiple reminders to unlock achievements
2. Watch for achievement notifications
3. **Expected Results:**
   - ✅ When an achievement is unlocked, a separate notification appears
   - ✅ Notification shows achievement icon, name, description, and XP reward
   - ✅ Achievement appears in the "Достижения" section on Dashboard

**What to check:**
- [ ] Achievement notification appeared (if unlocked)?
- [ ] Achievement shows in Dashboard section?
- [ ] Achievement details are correct?

---

### Test 4: Verify Database Activity Logs

**Steps:**
1. After completing one or more reminders
2. Run the verification script:
   ```bash
   DATABASE_URL='postgresql://nudge_user:nudge_password@localhost:5432/nudge' npx tsx scripts/verify-gamification.ts
   ```
3. **Expected Results:**
   - ✅ Script shows activity logs with action='REMINDER_COMPLETED'
   - ✅ Each log shows +20 XP awarded
   - ✅ User's totalXP, level, and currentStreak are updated in database
   - ✅ Number of activity logs matches number of completed reminders

**What to check:**
- [ ] Activity logs created in database?
- [ ] Each log has action='REMINDER_COMPLETED'?
- [ ] Each log shows xpAwarded=20?
- [ ] User stats updated in database?

---

## Database Verification Output Example

When you run the verification script, you should see output like this:

```
🔍 Verifying Gamification Functionality

📊 Total users in database: 1

👤 User: John Doe (ID: 1)
   Telegram ID: 123456789
   Level: 2
   Total XP: 60
   Current Streak: 3
   Longest Streak: 3
   Last Activity: 2026-01-02T19:53:57.000Z

   📝 Recent Activity Logs (3 total):
      - REMINDER_COMPLETED (+20 XP) at 2026-01-02T19:53:57.000Z
      - REMINDER_COMPLETED (+20 XP) at 2026-01-02T18:30:15.000Z
      - REMINDER_COMPLETED (+20 XP) at 2026-01-02T17:15:42.000Z

   📋 Reminders:
      Total: 5
      Completed: 3
      Pending: 2

   ✅ Recently Completed Reminders:
      - Reminder ID 3 completed at 2026-01-02T19:53:57.000Z
      - Reminder ID 2 completed at 2026-01-02T18:30:15.000Z
      - Reminder ID 1 completed at 2026-01-02T17:15:42.000Z

================================================================================

📊 Summary:
   Total activity logs in database: 3
   Total users: 1
   Activity logs for REMINDER_COMPLETED: 3

✅ Gamification is working! Activity logs are being created.
```

---

## Current Database State (Before New Tests)

As of the last verification run:

```
👤 User: Test (ID: 1606)
   Telegram ID: 1
   Level: 1
   Total XP: 0
   Current Streak: 0
   Longest Streak: 0
   Last Activity: Never

   📝 Recent Activity Logs: 0 total
   📋 Reminders: 1 completed, 0 pending

⚠️  No REMINDER_COMPLETED activity logs found.
```

**This indicates that the reminder was completed BEFORE the gamification fixes were implemented.**

---

## Troubleshooting

### Issue: No notification appears
**Solution:** Check browser console for errors. Ensure `useNotifications` composable is working.

### Issue: Stats don't update
**Solution:** Check that `fetchGamification()` is being called after `completeReminder()` in `pages/index.vue`.

### Issue: No activity logs in database
**Solution:** 
1. Check that the API endpoint is calling `updateStreak()`, `awardXP()`, and `checkAchievements()`
2. Verify the database connection is working
3. Check server logs for errors

### Issue: XP is 0 after completing reminder
**Solution:** The gamification functions might not be executing. Check:
1. `server/api/reminders/[id]/complete.post.ts` has the gamification calls
2. No errors in server console
3. Database connection is working

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Mark task 4 as complete
2. Move to Phase 2: Creating the new color scheme (task 5)
3. Continue with UI improvements

---

## Notes

- All gamification logic is in `server/utils/gamification.ts`
- XP values are defined in the `awardXP` function
- Achievements are checked after every reminder completion
- Streak is updated based on `lastActivityDate` in the users table
