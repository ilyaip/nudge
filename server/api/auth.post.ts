import { db, schema } from '../db'
import { eq } from 'drizzle-orm'

/**
 * POST /api/auth
 * Авторизация пользователя через Telegram
 * Создает пользователя, если его нет в базе
 * 
 * Возвращает данные пользователя
 */
export default defineEventHandler(async (event) => {
  try {
    // Получить данные пользователя из Telegram контекста (установлен middleware)
    const telegramUser = event.context.telegramUser

    if (!telegramUser || !telegramUser.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized: Telegram user not found'
      })
    }

    // Проверить, существует ли пользователь
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.telegramId, String(telegramUser.id)))
      .limit(1)

    // Если пользователя нет, создаем нового
    if (!user) {
      console.log('[Auth] Creating new user:', telegramUser.id)
      
      const [newUser] = await db
        .insert(schema.users)
        .values({
          telegramId: String(telegramUser.id),
          username: telegramUser.username || null,
          firstName: telegramUser.first_name || '',
          lastName: telegramUser.last_name || null,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
          level: 1,
          lastActivityDate: null
        })
        .returning()

      user = newUser
      
      console.log('[Auth] User created successfully:', user.id)
    } else {
      console.log('[Auth] Existing user found:', user.id)
      
      // Обновляем данные пользователя при каждом входе
      await db
        .update(schema.users)
        .set({
          username: telegramUser.username || null,
          firstName: telegramUser.first_name || '',
          lastName: telegramUser.last_name || null
        })
        .where(eq(schema.users.telegramId, String(telegramUser.id)))
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalXP: user.totalXP,
        level: user.level
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('[Auth] Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication failed'
    })
  }
})
