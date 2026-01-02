// API endpoint для запуска миграций
// ВАЖНО: Используйте только для первоначальной настройки!
// После запуска миграций удалите этот файл или добавьте авторизацию

import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '../db'

export default defineEventHandler(async (event) => {
  try {
    // Проверяем секретный ключ для безопасности
    const body = await readBody(event)
    const secret = body?.secret
    
    // Простая защита - используйте сложный секрет
    if (secret !== 'migrate-nudge-2026') {
      throw createError({
        statusCode: 403,
        message: 'Forbidden: Invalid secret'
      })
    }

    console.log('Starting database migration...')
    
    await migrate(db, { 
      migrationsFolder: './server/db/migrations' 
    })
    
    console.log('Migration completed successfully!')
    
    return {
      success: true,
      message: 'Database migrations completed successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Migration failed:', error)
    
    throw createError({
      statusCode: 500,
      message: `Migration failed: ${error.message}`
    })
  }
})
