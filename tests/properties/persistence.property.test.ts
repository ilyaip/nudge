import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { db } from '../../server/db'
import { users, contacts, reminders, userAchievements, activityLogs } from '../../server/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Property-Based тесты для сохранения данных
 * 
 * Эти тесты проверяют, что данные корректно сохраняются в базе данных
 * и могут быть восстановлены между сессиями без потери информации.
 */

describe('Persistence Properties', () => {
  // Очистка тестовых данных после каждого теста
  afterEach(async () => {
    // Удаляем тестовые данные в обратном порядке зависимостей
    await db.delete(activityLogs).execute()
    await db.delete(userAchievements).execute()
    await db.delete(reminders).execute()
    await db.delete(contacts).execute()
    await db.delete(users).execute()
  })

  describe('Property 12: Сохранение данных между сессиями', () => {
    it('должен сохранять и восстанавливать данные пользователя без потерь', async () => {
      // Feature: nudge-telegram-app, Property 12: Сохранение данных между сессиями
      // Validates: Requirements 6.2
      
      await fc.assert(
        fc.asyncProperty(
          // Генератор данных пользователя
          fc.record({
            telegramId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `tg_${s}`),
            username: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: null }),
            firstName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
            lastName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
            currentStreak: fc.integer({ min: 0, max: 365 }),
            longestStreak: fc.integer({ min: 0, max: 365 }),
            totalXP: fc.integer({ min: 0, max: 100000 }),
            level: fc.integer({ min: 1, max: 100 })
          }),
          async (userData) => {
            // Сохраняем пользователя в БД
            const [insertedUser] = await db.insert(users).values({
              telegramId: userData.telegramId,
              username: userData.username,
              firstName: userData.firstName,
              lastName: userData.lastName,
              currentStreak: userData.currentStreak,
              longestStreak: userData.longestStreak,
              totalXP: userData.totalXP,
              level: userData.level
            }).returning()

            // "Закрываем сессию" - имитируем закрытие приложения
            // В реальности это просто новый запрос к БД

            // "Открываем новую сессию" - получаем данные из БД
            const [retrievedUser] = await db
              .select()
              .from(users)
              .where(eq(users.telegramId, userData.telegramId))

            // Проверяем, что все данные сохранились
            expect(retrievedUser).toBeDefined()
            expect(retrievedUser.telegramId).toBe(userData.telegramId)
            expect(retrievedUser.username).toBe(userData.username)
            expect(retrievedUser.firstName).toBe(userData.firstName)
            expect(retrievedUser.lastName).toBe(userData.lastName)
            expect(retrievedUser.currentStreak).toBe(userData.currentStreak)
            expect(retrievedUser.longestStreak).toBe(userData.longestStreak)
            expect(retrievedUser.totalXP).toBe(userData.totalXP)
            expect(retrievedUser.level).toBe(userData.level)

            // Очистка для следующей итерации
            await db.delete(users).where(eq(users.id, insertedUser.id))
          }
        ),
        { numRuns: 100 }
      )
    })

    it('должен сохранять и восстанавливать контакты пользователя', async () => {
      // Feature: nudge-telegram-app, Property 12: Сохранение данных между сессиями
      // Validates: Requirements 6.2
      
      await fc.assert(
        fc.asyncProperty(
          // Генератор пользователя
          fc.string({ minLength: 5, maxLength: 20 }).map(s => `tg_${s}`),
          // Генератор массива контактов
          fc.array(
            fc.record({
              telegramContactId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `contact_${s}`),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              username: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: null }),
              isTracked: fc.boolean(),
              frequency: fc.constantFrom('weekly', 'monthly', 'quarterly', 'custom'),
              customFrequencyDays: fc.option(fc.integer({ min: 1, max: 365 }), { nil: null }),
              communicationType: fc.constantFrom('message', 'call', 'meeting'),
              category: fc.constantFrom('family', 'friends', 'colleagues', 'business')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (telegramId, contactsData) => {
            // Создаем пользователя
            const [user] = await db.insert(users).values({
              telegramId,
              username: 'testuser',
              firstName: 'Test',
              lastName: 'User'
            }).returning()

            // Сохраняем контакты
            const insertedContacts = await db.insert(contacts).values(
              contactsData.map(contact => ({
                userId: user.id,
                telegramContactId: contact.telegramContactId,
                name: contact.name,
                username: contact.username,
                isTracked: contact.isTracked,
                frequency: contact.frequency,
                customFrequencyDays: contact.customFrequencyDays,
                communicationType: contact.communicationType,
                category: contact.category
              }))
            ).returning()

            // "Закрываем и открываем сессию"
            const retrievedContacts = await db
              .select()
              .from(contacts)
              .where(eq(contacts.userId, user.id))

            // Проверяем, что все контакты сохранились
            expect(retrievedContacts).toHaveLength(contactsData.length)
            
            for (let i = 0; i < contactsData.length; i++) {
              const original = contactsData[i]
              const retrieved = retrievedContacts.find(
                c => c.telegramContactId === original.telegramContactId
              )
              
              expect(retrieved).toBeDefined()
              expect(retrieved!.name).toBe(original.name)
              expect(retrieved!.username).toBe(original.username)
              expect(retrieved!.isTracked).toBe(original.isTracked)
              expect(retrieved!.frequency).toBe(original.frequency)
              expect(retrieved!.customFrequencyDays).toBe(original.customFrequencyDays)
              expect(retrieved!.communicationType).toBe(original.communicationType)
              expect(retrieved!.category).toBe(original.category)
            }

            // Очистка
            await db.delete(contacts).where(eq(contacts.userId, user.id))
            await db.delete(users).where(eq(users.id, user.id))
          }
        ),
        { numRuns: 50 }
      )
    })

    it('должен сохранять и восстанавливать полное состояние пользователя', async () => {
      // Feature: nudge-telegram-app, Property 12: Сохранение данных между сессиями
      // Validates: Requirements 6.2
      
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            telegramId: fc.string({ minLength: 5, maxLength: 20 }).map(s => `tg_${s}`),
            currentStreak: fc.integer({ min: 0, max: 100 }),
            longestStreak: fc.integer({ min: 0, max: 100 }),
            totalXP: fc.integer({ min: 0, max: 10000 }),
            level: fc.integer({ min: 1, max: 50 }),
            contactsCount: fc.integer({ min: 0, max: 3 })
          }),
          async (state) => {
            // Создаем пользователя с состоянием
            const [user] = await db.insert(users).values({
              telegramId: state.telegramId,
              username: 'testuser',
              firstName: 'Test',
              currentStreak: state.currentStreak,
              longestStreak: state.longestStreak,
              totalXP: state.totalXP,
              level: state.level
            }).returning()

            // Создаем контакты
            const contactsToInsert = Array.from({ length: state.contactsCount }, (_, i) => ({
              userId: user.id,
              telegramContactId: `contact_${i}_${Date.now()}`,
              name: `Contact ${i}`,
              isTracked: true,
              frequency: 'monthly' as const,
              communicationType: 'message' as const,
              category: 'friends' as const
            }))

            if (contactsToInsert.length > 0) {
              await db.insert(contacts).values(contactsToInsert)
            }

            // "Закрываем приложение и открываем снова"
            
            // Восстанавливаем состояние пользователя
            const [retrievedUser] = await db
              .select()
              .from(users)
              .where(eq(users.telegramId, state.telegramId))

            const retrievedContacts = await db
              .select()
              .from(contacts)
              .where(eq(contacts.userId, user.id))

            // Проверяем полное восстановление состояния
            expect(retrievedUser).toBeDefined()
            expect(retrievedUser.currentStreak).toBe(state.currentStreak)
            expect(retrievedUser.longestStreak).toBe(state.longestStreak)
            expect(retrievedUser.totalXP).toBe(state.totalXP)
            expect(retrievedUser.level).toBe(state.level)
            expect(retrievedContacts).toHaveLength(state.contactsCount)

            // Очистка
            await db.delete(contacts).where(eq(contacts.userId, user.id))
            await db.delete(users).where(eq(users.id, user.id))
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
