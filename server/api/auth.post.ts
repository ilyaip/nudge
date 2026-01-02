import { createHmac } from 'crypto'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface AuthRequest {
  initData: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<AuthRequest>(event)
    
    if (!body.initData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing initData'
      })
    }

    // Validate initData signature
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Bot token not configured'
      })
    }

    const isValid = validateTelegramInitData(body.initData, botToken)
    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid initData signature'
      })
    }

    // Parse initData
    const params = new URLSearchParams(body.initData)
    const userParam = params.get('user')
    
    if (!userParam) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing user data in initData'
      })
    }

    const telegramUser: TelegramUser = JSON.parse(userParam)
    
    // Get or create user in database
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramUser.id.toString()))
      .limit(1)

    let user
    if (existingUsers.length > 0) {
      // Update existing user
      user = existingUsers[0]
      await db
        .update(users)
        .set({
          username: telegramUser.username || null,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
    } else {
      // Create new user
      const newUsers = await db
        .insert(users)
        .values({
          telegramId: telegramUser.id.toString(),
          username: telegramUser.username || null,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null
        })
        .returning()
      
      user = newUsers[0]
    }

    // Return user data (in a real app, you'd return a JWT or session token)
    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
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
    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }
    
    // Log unexpected errors
    console.error('Authentication error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

/**
 * Validates Telegram Web App initData signature
 * @param initData - The initData string from Telegram Web App
 * @param botToken - The Telegram bot token
 * @returns true if signature is valid, false otherwise
 */
function validateTelegramInitData(initData: string, botToken: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    
    if (!hash) {
      return false
    }

    // Remove hash from params
    params.delete('hash')
    
    // Sort params alphabetically and create data-check-string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Create secret key from bot token
    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Calculate hash
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    // Compare hashes
    return calculatedHash === hash
  } catch (error) {
    console.error('Error validating initData:', error)
    return false
  }
}
