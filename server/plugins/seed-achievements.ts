import { db, schema } from '../db'
import { achievementSeeds } from '../db/seeds/achievements'

/**
 * Плагин Nitro для автоматического заполнения таблицы достижений
 * Запускается при старте сервера и добавляет достижения, если их нет
 */
export default defineNitroPlugin(async (nitroApp) => {
  console.log('[Seed Plugin] Проверка таблицы достижений...')
  
  try {
    // Проверяем, есть ли уже достижения в базе
    const existing = await db.select().from(schema.achievements)
    
    if (existing.length > 0) {
      console.log(`[Seed Plugin] ✓ В базе уже есть ${existing.length} достижений`)
      return
    }

    // Вставляем достижения
    console.log(`[Seed Plugin] Добавление ${achievementSeeds.length} достижений...`)
    await db.insert(schema.achievements).values(achievementSeeds)
    
    console.log(`[Seed Plugin] ✅ Успешно добавлено ${achievementSeeds.length} достижений`)
  } catch (error) {
    console.error('[Seed Plugin] ❌ Ошибка при заполнении достижений:', error)
    // Не бросаем ошибку, чтобы не блокировать запуск сервера
  }
})
