import { db, schema } from '../index'

/**
 * Seed-данные для таблицы достижений
 */
export const achievementSeeds = [
  {
    code: 'FIRST_CONTACT',
    name: 'Первый контакт',
    description: 'Добавьте свой первый контакт для отслеживания',
    icon: '👤',
    xpReward: 10,
    criteria: { minContacts: 1 }
  },
  {
    code: 'SOCIAL_BUTTERFLY',
    name: 'Социальная бабочка',
    description: 'Добавьте 10 контактов для отслеживания',
    icon: '🦋',
    xpReward: 50,
    criteria: { minContacts: 10 }
  },
  {
    code: 'NETWORK_MASTER',
    name: 'Мастер сетей',
    description: 'Добавьте 50 контактов для отслеживания',
    icon: '🌐',
    xpReward: 200,
    criteria: { minContacts: 50 }
  },
  {
    code: 'FIRST_REMINDER',
    name: 'Первое напоминание',
    description: 'Выполните свое первое напоминание',
    icon: '✅',
    xpReward: 20,
    criteria: { minRemindersCompleted: 1 }
  },
  {
    code: 'CONSISTENT_COMMUNICATOR',
    name: 'Постоянный коммуникатор',
    description: 'Выполните 10 напоминаний',
    icon: '💬',
    xpReward: 100,
    criteria: { minRemindersCompleted: 10 }
  },
  {
    code: 'CONNECTION_CHAMPION',
    name: 'Чемпион связей',
    description: 'Выполните 50 напоминаний',
    icon: '🏆',
    xpReward: 300,
    criteria: { minRemindersCompleted: 50 }
  },
  {
    code: 'STREAK_STARTER',
    name: 'Начало серии',
    description: 'Достигните стрика в 3 дня',
    icon: '🔥',
    xpReward: 30,
    criteria: { minStreak: 3 }
  },
  {
    code: 'WEEK_WARRIOR',
    name: 'Воин недели',
    description: 'Достигните стрика в 7 дней',
    icon: '⚡',
    xpReward: 100,
    criteria: { minStreak: 7 }
  },
  {
    code: 'MONTH_MASTER',
    name: 'Мастер месяца',
    description: 'Достигните стрика в 30 дней',
    icon: '🌟',
    xpReward: 500,
    criteria: { minStreak: 30 }
  },
  {
    code: 'LEVEL_5',
    name: 'Уровень 5',
    description: 'Достигните 5 уровня',
    icon: '⭐',
    xpReward: 50,
    criteria: { minLevel: 5 }
  },
  {
    code: 'LEVEL_10',
    name: 'Уровень 10',
    description: 'Достигните 10 уровня',
    icon: '🌠',
    xpReward: 150,
    criteria: { minLevel: 10 }
  },
  {
    code: 'XP_COLLECTOR',
    name: 'Коллекционер XP',
    description: 'Накопите 1000 XP',
    icon: '💎',
    xpReward: 100,
    criteria: { minXP: 1000 }
  },
  {
    code: 'XP_MASTER',
    name: 'Мастер XP',
    description: 'Накопите 5000 XP',
    icon: '💠',
    xpReward: 500,
    criteria: { minXP: 5000 }
  }
]

/**
 * Функция для заполнения таблицы достижений начальными данными
 */
export async function seedAchievements() {
  try {
    console.log('Начало заполнения таблицы достижений...')
    
    // Проверяем, есть ли уже достижения в базе
    const existing = await db.select().from(schema.achievements)
    
    if (existing.length > 0) {
      console.log(`В базе уже есть ${existing.length} достижений. Пропускаем заполнение.`)
      return
    }

    // Вставляем достижения
    await db.insert(schema.achievements).values(achievementSeeds)
    
    console.log(`Успешно добавлено ${achievementSeeds.length} достижений`)
  } catch (error) {
    console.error('Ошибка при заполнении таблицы достижений:', error)
    throw error
  }
}

// Если файл запущен напрямую, выполняем seed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAchievements()
    .then(() => {
      console.log('Заполнение завершено')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Ошибка:', error)
      process.exit(1)
    })
}
