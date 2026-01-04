// API endpoint для запуска миграций
// ВАЖНО: Используйте только для первоначальной настройки!
// После запуска миграций удалите этот файл или добавьте авторизацию

import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { db } from '../db'
import { existsSync, readdirSync } from 'fs'
import { resolve } from 'path'

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
    
    // Определяем путь к миграциям
    const possiblePaths = [
      './server/db/migrations',
      '../server/db/migrations',
      resolve(process.cwd(), 'server/db/migrations'),
      '/app/server/db/migrations'
    ]
    
    let migrationsFolder = './server/db/migrations'
    
    for (const path of possiblePaths) {
      console.log(`Checking migrations path: ${path}`)
      if (existsSync(path)) {
        console.log(`Found migrations at: ${path}`)
        try {
          const files = readdirSync(path)
          console.log(`Migration files: ${files.join(', ')}`)
          migrationsFolder = path
          break
        } catch (e) {
          console.log(`Cannot read directory: ${path}`)
        }
      }
    }
    
    console.log(`Using migrations folder: ${migrationsFolder}`)
    
    await migrate(db, { migrationsFolder })
    
    console.log('Migration completed successfully!')
    
    return {
      success: true,
      message: 'Database migrations completed successfully',
      migrationsFolder,
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
