import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { db, schema } from '../../server/db'
import { eq, and } from 'drizzle-orm'
import { updateStreak, awardXP, checkAchievements, calculateLevel } from '../../server/utils/gamification'
import { calculateNextReminderDate } from '../../server/utils/reminders'
import { achievementSeeds } from '../../server/db/seeds/achievements'

/**
 * End-to-End тест геймификации
 * Полный сценарий: создание пользователя → добавление контактов → завершение напоминаний → проверка всех показателей
 * 
 * Требования: 1.1-1.5, 2.1-2.4
 */
describe('E2E: Полное тестирование геймификации', () => {
  let testUserId: number
  let testContactIds: number[] = []
  let testReminderIds: number[] = []

  beforeAll(async () => {
    // Проверяем и добавляем достижения, если их нет
    const existingAchievements = await db.select().from(schema.achievements)
    if (existingAchievements.length === 0) {
      await db.insert(schema.achievements).values(achievementSeeds)
      console.log(`✓ Добавлено ${achievementSeeds.length} достижений в базу`)
    }

    // Создаем тестового пользователя
    const [user] = await db
      .insert(schema.users)
      .values({
        telegramId: `test_e2e_${Date.now()}`,
        username: 'test_gamification_user',
        firstName: 'Test',
        lastName: 'User',
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        level: 1
      })
      .returning()

    testUserId = user.id
    console.log(`✓ Создан тестовый пользователь ID: ${testUserId}`)
  })

  afterAll(async () => {
    // Очистка: удаляем тестовые данные
    if (testUserId) {
      await db.delete(schema.users).where(eq(schema.users.id, testUserId))
      console.log(`✓ Удален тестовый пользователь ID: ${testUserId}`)
    }
  })

  it('Шаг 1: Создать нового пользователя', async () => {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    expect(user).toBeDefined()
    expect(user.totalXP).toBe(0)
    expect(user.level).toBe(1)
    expect(user.currentStreak).toBe(0)
    expect(user.longestStreak).toBe(0)
    
    console.log('✓ Пользователь создан с начальными значениями')
  })

  it('Шаг 2: Добавить контакты', async () => {
    // Добавляем 3 контакта
    const contactsToAdd = [
      {
        userId: testUserId,
        telegramContactId: 'contact_1',
        name: 'Алиса',
        username: 'alice',
        isTracked: true,
        frequency: 'weekly' as const,
        communicationType: 'message' as const,
        category: 'friends' as const,
        lastContactDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 дней назад
      },
      {
        userId: testUserId,
        telegramContactId: 'contact_2',
        name: 'Боб',
        username: 'bob',
        isTracked: true,
        frequency: 'monthly' as const,
        communicationType: 'call' as const,
        category: 'family' as const,
        lastContactDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 дней назад
      },
      {
        userId: testUserId,
        telegramContactId: 'contact_3',
        name: 'Чарли',
        username: 'charlie',
        isTracked: true,
        frequency: 'daily' as const,
        communicationType: 'message' as const,
        category: 'work' as const,
        lastContactDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 дня назад
      }
    ]

    for (const contactData of contactsToAdd) {
      const [contact] = await db
        .insert(schema.contacts)
        .values(contactData)
        .returning()

      testContactIds.push(contact.id)

      // Начисляем XP за добавление контакта
      await awardXP(testUserId, 'CONTACT_ADDED')
    }

    expect(testContactIds.length).toBe(3)

    // Проверяем, что XP начислен
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    expect(user.totalXP).toBe(30) // 3 контакта * 10 XP
    expect(user.level).toBe(1) // Еще на 1 уровне
    
    console.log(`✓ Добавлено ${testContactIds.length} контактов, начислено 30 XP`)
  })

  it('Шаг 3: Создать напоминания для контактов', async () => {
    // Создаем напоминания для каждого контакта
    for (const contactId of testContactIds) {
      const [contact] = await db
        .select()
        .from(schema.contacts)
        .where(eq(schema.contacts.id, contactId))
        .limit(1)

      const nextReminderDate = calculateNextReminderDate(contact)

      // Обновляем nextReminderDate контакта
      await db
        .update(schema.contacts)
        .set({ nextReminderDate })
        .where(eq(schema.contacts.id, contactId))

      // Создаем напоминание на сегодня
      const [reminder] = await db
        .insert(schema.reminders)
        .values({
          userId: testUserId,
          contactId: contactId,
          dueDate: new Date(), // Сегодня
          completed: false,
          notificationSent: false
        })
        .returning()

      testReminderIds.push(reminder.id)
    }

    expect(testReminderIds.length).toBe(3)
    console.log(`✓ Создано ${testReminderIds.length} напоминаний`)
  })

  it('Шаг 4: Завершить первое напоминание и проверить XP', async () => {
    const reminderId = testReminderIds[0]

    // Завершаем напоминание
    await db
      .update(schema.reminders)
      .set({
        completed: true,
        completedAt: new Date()
      })
      .where(eq(schema.reminders.id, reminderId))

    // Обновляем streak и начисляем XP
    await updateStreak(testUserId)
    await awardXP(testUserId, 'REMINDER_COMPLETED')

    // Проверяем обновленные данные
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    expect(user.totalXP).toBe(50) // 30 (контакты) + 20 (напоминание)
    expect(user.currentStreak).toBe(1) // Первый день streak
    expect(user.longestStreak).toBe(1)
    expect(user.level).toBe(1) // Еще на 1 уровне (нужно 100 XP для уровня 2)

    console.log('✓ Первое напоминание завершено: +20 XP, streak = 1')
  })

  it('Шаг 5: Завершить второе напоминание и проверить streak', async () => {
    const reminderId = testReminderIds[1]

    // Завершаем напоминание
    await db
      .update(schema.reminders)
      .set({
        completed: true,
        completedAt: new Date()
      })
      .where(eq(schema.reminders.id, reminderId))

    // Обновляем streak и начисляем XP (в тот же день)
    await updateStreak(testUserId)
    await awardXP(testUserId, 'REMINDER_COMPLETED')

    // Проверяем обновленные данные
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    expect(user.totalXP).toBe(70) // 50 + 20
    expect(user.currentStreak).toBe(1) // Тот же день, streak не увеличивается
    expect(user.level).toBe(1)

    console.log('✓ Второе напоминание завершено: +20 XP, streak остался 1 (тот же день)')
  })

  it('Шаг 6: Завершить третье напоминание и проверить повышение уровня', async () => {
    const reminderId = testReminderIds[2]

    // Завершаем напоминание
    await db
      .update(schema.reminders)
      .set({
        completed: true,
        completedAt: new Date()
      })
      .where(eq(schema.reminders.id, reminderId))

    // Обновляем streak и начисляем XP
    await updateStreak(testUserId)
    await awardXP(testUserId, 'REMINDER_COMPLETED')

    // Проверяем обновленные данные
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    expect(user.totalXP).toBe(90) // 70 + 20
    expect(user.level).toBe(1) // Еще на 1 уровне (нужно 100 XP)

    console.log('✓ Третье напоминание завершено: +20 XP, всего 90 XP')
  })

  it('Шаг 7: Добавить еще один контакт для перехода на уровень 2', async () => {
    // Добавляем еще один контакт
    const [contact] = await db
      .insert(schema.contacts)
      .values({
        userId: testUserId,
        telegramContactId: 'contact_4',
        name: 'Дэвид',
        username: 'david',
        isTracked: true,
        frequency: 'weekly' as const,
        communicationType: 'message' as const,
        category: 'friends' as const
      })
      .returning()

    testContactIds.push(contact.id)

    // Начисляем XP за добавление контакта
    await awardXP(testUserId, 'CONTACT_ADDED')

    // Проверяем повышение уровня
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    expect(user.totalXP).toBe(100) // 90 + 10
    expect(user.level).toBe(2) // Переход на уровень 2!

    console.log('✓ Добавлен 4-й контакт: +10 XP, переход на уровень 2!')
  })

  it('Шаг 8: Проверить разблокировку достижений', async () => {
    // Проверяем достижения
    const newAchievements = await checkAchievements(testUserId)

    // Получаем все разблокированные достижения пользователя
    const userAchievements = await db
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, testUserId))

    expect(userAchievements.length).toBeGreaterThan(0)

    // Проверяем, что XP начислен за достижения
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    // XP должен увеличиться на 50 за каждое разблокированное достижение
    const expectedMinXP = 100 + (userAchievements.length * 50)
    expect(user.totalXP).toBeGreaterThanOrEqual(expectedMinXP)

    console.log(`✓ Разблокировано ${userAchievements.length} достижений, начислено ${userAchievements.length * 50} XP`)
  })

  it('Шаг 9: Проверить график активности (activity logs)', async () => {
    // Получаем все логи активности пользователя
    const activityLogs = await db
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, testUserId))

    expect(activityLogs.length).toBeGreaterThan(0)

    // Проверяем типы действий
    const actions = activityLogs.map(log => log.action)
    expect(actions).toContain('CONTACT_ADDED')
    expect(actions).toContain('REMINDER_COMPLETED')

    // Проверяем, что XP начислен
    const totalXPFromLogs = activityLogs.reduce((sum, log) => sum + log.xpAwarded, 0)
    expect(totalXPFromLogs).toBeGreaterThan(0)

    console.log(`✓ Создано ${activityLogs.length} записей в логе активности`)
  })

  it('Шаг 10: Проверить все показатели геймификации', async () => {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    // XP начисляется?
    expect(user.totalXP).toBeGreaterThan(0)
    console.log(`  ✓ XP начисляется: ${user.totalXP} XP`)

    // Уровень растет?
    expect(user.level).toBeGreaterThanOrEqual(2)
    console.log(`  ✓ Уровень растет: уровень ${user.level}`)

    // Streak обновляется?
    expect(user.currentStreak).toBeGreaterThan(0)
    expect(user.longestStreak).toBeGreaterThanOrEqual(user.currentStreak)
    console.log(`  ✓ Streak обновляется: текущий ${user.currentStreak}, максимальный ${user.longestStreak}`)

    // Достижения разблокируются?
    const achievements = await db
      .select()
      .from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, testUserId))

    expect(achievements.length).toBeGreaterThan(0)
    console.log(`  ✓ Достижения разблокируются: ${achievements.length} разблокировано`)

    // График активности обновляется?
    const activityLogs = await db
      .select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, testUserId))

    expect(activityLogs.length).toBeGreaterThan(0)
    console.log(`  ✓ График активности обновляется: ${activityLogs.length} записей`)

    console.log('\n✅ Все показатели геймификации работают корректно!')
  })

  it('Шаг 11: Проверить расчет уровня', async () => {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, testUserId))
      .limit(1)

    const calculatedLevel = calculateLevel(user.totalXP)
    expect(user.level).toBe(calculatedLevel)

    console.log(`✓ Уровень рассчитывается корректно: ${user.level} (XP: ${user.totalXP})`)
  })

  it('Шаг 12: Проверить, что напоминания помечены как выполненные', async () => {
    const completedReminders = await db
      .select()
      .from(schema.reminders)
      .where(
        and(
          eq(schema.reminders.userId, testUserId),
          eq(schema.reminders.completed, true)
        )
      )

    expect(completedReminders.length).toBe(3) // Все 3 напоминания завершены
    
    completedReminders.forEach(reminder => {
      expect(reminder.completed).toBe(true)
      expect(reminder.completedAt).toBeDefined()
    })

    console.log(`✓ Все ${completedReminders.length} напоминания помечены как выполненные`)
  })
})
