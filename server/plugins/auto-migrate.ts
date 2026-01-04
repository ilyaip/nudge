import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

export default defineNitroPlugin(async () => {
  // Запускаем миграции только в production
  if (process.env.NODE_ENV !== 'production') {
    console.log('[auto-migrate] Пропуск миграций в development режиме')
    return
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('[auto-migrate] DATABASE_URL не установлен')
    return
  }

  console.log('[auto-migrate] Запуск миграций базы данных...')

  try {
    // Создаём отдельное подключение для миграций
    const migrationClient = postgres(connectionString, { max: 1 })
    const db = drizzle(migrationClient)

    await migrate(db, { migrationsFolder: './server/db/migrations' })

    console.log('[auto-migrate] ✅ Миграции успешно применены')

    await migrationClient.end()
  } catch (error) {
    console.error('[auto-migrate] ❌ Ошибка миграции:', error)
    // Не бросаем ошибку, чтобы приложение могло запуститься
  }
})
