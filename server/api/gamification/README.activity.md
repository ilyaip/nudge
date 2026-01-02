# API Визуализации Активности

## Обзор

API endpoint для получения агрегированных данных активности пользователя за определенный период времени.

## Endpoint

### GET /api/gamification/activity

Получить агрегированные данные активности пользователя.

#### Query параметры

- `period` (опционально): Период агрегации
  - `week` - последние 7 дней (по умолчанию)
  - `month` - последние 30 дней

#### Пример запроса

```typescript
// Получить данные за неделю
const response = await $fetch('/api/gamification/activity?period=week')

// Получить данные за месяц
const response = await $fetch('/api/gamification/activity?period=month')
```

#### Ответ

```typescript
{
  success: true,
  data: {
    period: 'week' | 'month',
    startDate: string, // YYYY-MM-DD
    endDate: string,   // YYYY-MM-DD
    activities: [
      {
        date: string,              // YYYY-MM-DD
        completedReminders: number, // Количество завершенных напоминаний
        xpEarned: number           // Заработанный XP
      }
    ],
    totalCompleted: number, // Общее количество завершенных напоминаний
    totalXP: number        // Общий XP за период
  }
}
```

#### Пример ответа

```json
{
  "success": true,
  "data": {
    "period": "week",
    "startDate": "2026-01-26",
    "endDate": "2026-02-01",
    "activities": [
      {
        "date": "2026-01-26",
        "completedReminders": 3,
        "xpEarned": 60
      },
      {
        "date": "2026-01-27",
        "completedReminders": 2,
        "xpEarned": 40
      },
      {
        "date": "2026-01-28",
        "completedReminders": 0,
        "xpEarned": 0
      }
    ],
    "totalCompleted": 15,
    "totalXP": 300
  }
}
```

## Утилиты

### aggregateActivity(userId, period)

Агрегирует логи активности по дням для указанного периода.

**Параметры:**
- `userId` (number): ID пользователя
- `period` ('week' | 'month'): Период агрегации

**Возвращает:** Promise<ActivityData>

### getCompletedRemindersCount(userId, period)

Получает количество завершенных напоминаний за период.

**Параметры:**
- `userId` (number): ID пользователя
- `period` ('week' | 'month'): Период агрегации

**Возвращает:** Promise<number>

### getTotalXPForPeriod(userId, period)

Получает общий XP, заработанный за период.

**Параметры:**
- `userId` (number): ID пользователя
- `period` ('week' | 'month'): Период агрегации

**Возвращает:** Promise<number>

## Composable

### useActivity()

Composable для работы с данными активности в компонентах Vue.

**Методы:**
- `fetchActivity(period)` - Загрузить данные активности
- `switchPeriod(period)` - Переключить период отображения
- `clearError()` - Очистить ошибку

**Свойства:**
- `activityData` - Полные данные активности
- `currentPeriod` - Текущий период
- `isLoading` - Флаг загрузки
- `error` - Сообщение об ошибке
- `activities` - Массив данных по дням
- `totalCompleted` - Общее количество завершенных напоминаний
- `totalXP` - Общий XP
- `maxValue` - Максимальное значение для масштабирования
- `averagePerDay` - Среднее количество напоминаний в день

## Компонент

### ActivityChart.vue

Компонент для отображения графика активности пользователя.

**Особенности:**
- Столбчатая диаграмма с данными по дням
- Переключение между недельным и месячным видом
- Tooltip с детальной информацией при наведении
- Отображение статистики (всего выполнено, заработано XP)
- Адаптивный дизайн

**Использование:**

```vue
<template>
  <ActivityChart />
</template>

<script setup>
import ActivityChart from '~/components/ActivityChart.vue'
</script>
```

## Требования

Реализация соответствует требованиям:
- **5.1**: Отображение графика активности на Dashboard
- **5.2**: Показ количества завершенных напоминаний по временным периодам

## Тестирование

Тесты находятся в `tests/unit/api/activity.test.ts` и покрывают:
- Агрегацию данных за неделю и месяц
- Инициализацию всех дней нулями
- Корректность дат начала и конца периода
- Подсчет завершенных напоминаний
- Подсчет общего XP
