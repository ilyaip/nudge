# Компоненты UI

Этот документ описывает переиспользуемые компоненты для состояний загрузки и обработки ошибок.

## LoadingSpinner

Компонент индикатора загрузки с анимированным спиннером.

### Использование

```vue
<LoadingSpinner 
  size="medium" 
  color="blue" 
  message="Загрузка данных..." 
  centered 
/>
```

### Props

- `size` - Размер спиннера: `'small'`, `'medium'`, `'large'` (по умолчанию: `'medium'`)
- `color` - Цвет спиннера: `'blue'`, `'white'`, `'gray'` (по умолчанию: `'blue'`)
- `message` - Опциональное сообщение под спиннером
- `centered` - Центрировать по вертикали (по умолчанию: `false`)

## SkeletonLoader

Компонент skeleton loader для отображения состояния загрузки с анимированными заглушками.

### Использование

```vue
<SkeletonLoader 
  type="card" 
  :count="3" 
  show-header 
/>
```

### Props

- `type` - Тип skeleton: `'card'`, `'list'`, `'table'`, `'grid'`, `'stats'`, `'custom'` (по умолчанию: `'card'`)
- `count` - Количество элементов для отображения (по умолчанию: `3`)
- `showHeader` - Показывать заголовок (по умолчанию: `false`)
- `class` - Дополнительные CSS классы

### Типы skeleton

- **card** - Карточки с аватаром и контентом
- **list** - Простой список элементов
- **table** - Таблица с заголовком и строками
- **grid** - Сетка элементов (для достижений)
- **stats** - Статистические виджеты
- **custom** - Пользовательский контент через slot

## ErrorMessage

Компонент для отображения сообщений об ошибках с поддержкой повтора операций.

### Использование

```vue
<ErrorMessage
  :message="error"
  title="Ошибка загрузки"
  type="error"
  retryable
  :on-retry="loadData"
/>
```

### Props

- `message` - Сообщение об ошибке (обязательно)
- `title` - Заголовок (опционально)
- `type` - Тип ошибки: `'error'`, `'warning'`, `'info'` (по умолчанию: `'error'`)
- `details` - Технические детали ошибки (показываются только в режиме разработки)
- `dismissible` - Можно ли закрыть сообщение (по умолчанию: `false`)
- `retryable` - Можно ли повторить операцию (по умолчанию: `false`)
- `onRetry` - Callback для повтора
- `onDismiss` - Callback для закрытия
- `onCancel` - Callback для отмены

### События

- `retry` - Испускается при нажатии на кнопку повтора
- `dismiss` - Испускается при закрытии сообщения
- `cancel` - Испускается при отмене

## NotificationToast

Компонент для отображения toast-уведомлений в правом верхнем углу экрана.

### Использование

Компонент автоматически добавлен в `app.vue` и использует composable `useNotifications`:

```vue
<script setup>
import { useNotifications } from '~/composables/useNotifications'

const { showSuccess, showError, showWarning, showInfo } = useNotifications()

// Показать уведомление об успехе
showSuccess('Операция выполнена успешно', 'Успех')

// Показать ошибку
showError('Произошла ошибка', 'Ошибка')

// Показать предупреждение
showWarning('Внимание!', 'Предупреждение')

// Показать информацию
showInfo('Полезная информация', 'Информация')
</script>
```

## Composables

### useNotifications

Composable для управления toast-уведомлениями.

#### Методы

- `showSuccess(message, title?, duration?)` - Показать уведомление об успехе
- `showError(message, title?, duration?)` - Показать уведомление об ошибке (не закрывается автоматически)
- `showWarning(message, title?, duration?)` - Показать предупреждение
- `showInfo(message, title?, duration?)` - Показать информационное уведомление
- `clearAll()` - Очистить все уведомления

### useCache

Composable для управления кэшированием данных в памяти.

#### Методы

- `get<T>(key)` - Получить данные из кэша
- `set<T>(key, data, ttl?)` - Сохранить данные в кэш (TTL по умолчанию: 5 минут)
- `remove(key)` - Удалить данные из кэша
- `clear()` - Очистить весь кэш
- `has(key)` - Проверить наличие данных в кэше
- `getOrFetch<T>(key, fetcher, ttl?)` - Получить из кэша или загрузить
- `invalidate(pattern)` - Инвалидировать кэш по паттерну

#### Использование

```typescript
import { useCache } from '~/composables/useCache'

const { getOrFetch, invalidate } = useCache()

// Получить данные с кэшированием
const data = await getOrFetch(
  'contacts-123',
  async () => {
    return await $fetch('/api/contacts')
  },
  5 * 60 * 1000 // 5 минут
)

// Инвалидировать кэш
invalidate('contacts-') // Удалит все ключи, начинающиеся с 'contacts-'
```

## Оптимистичные обновления

Composables `useReminders` и `useContacts` теперь поддерживают оптимистичные обновления:

- UI обновляется немедленно при выполнении операции
- Если операция завершается с ошибкой, изменения откатываются
- Это обеспечивает лучший UX и более отзывчивый интерфейс

## Персистентность состояния

Auth store автоматически сохраняется в localStorage через plugin `pinia-persist.client.ts`:

- Состояние аутентификации сохраняется между сессиями
- Автоматическое восстановление при перезагрузке страницы
- Защита от поврежденных данных
