import { db, schema } from '../server/db'
import { achievementSeeds } from '../server/db/seeds/achievements'

/**
 * Скрипт для заполнения таблицы достижений в продакшене
 * Запуск: npx tsx scripts/seed-achievements.ts
 */
async function seedAchievementsProduction() {
  try {
    console.log('🚀 Начало заполнения таблицы достижений...')
    console.log(`📊 Подготовлено ${achievementSeeds.length} достижений`)
    
    // Проверяем, есть ли уже достижения в базе
    const existing = await db.select().from(schema.achievements)
    
    if (existing.length > 0) {
      console.log(`⚠️  В базе уже есть ${existing.length} достижений.`)
      console.log('Хотите обновить? Удалите существующие записи вручную и запустите скрипт снова.')
      return
    }

    // Вставляем достижения
    await db.insert(schema.achievements).values(achievementSeeds)
    
    console.log(`✅ Успешно добавлено ${achievementSeeds.length} достижений:`)
    achievementSeeds.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.icon} ${a.name} (${a.code}) - ${a.xpReward} XP`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка при заполнении таблицы достижений:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

seedAchievementsProduction()
