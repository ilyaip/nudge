import { ref } from 'vue'

/**
 * Интерфейс элемента кэша
 */
interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

/**
 * Кэш данных в памяти
 */
const cache = new Map<string, CacheItem<any>>()

/**
 * Composable для управления кэшированием данных
 * Помогает избежать лишних запросов к API
 */
export const useCache = () => {
  /**
   * Получить данные из кэша
   * @param key - Ключ кэша
   * @returns Данные или null, если кэш устарел или отсутствует
   */
  const get = <T>(key: string): T | null => {
    const item = cache.get(key)
    
    if (!item) {
      return null
    }
    
    // Проверяем, не истек ли срок действия кэша
    if (Date.now() > item.expiresAt) {
      cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  /**
   * Сохранить данные в кэш
   * @param key - Ключ кэша
   * @param data - Данные для сохранения
   * @param ttl - Время жизни в миллисекундах (по умолчанию 5 минут)
   */
  const set = <T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void => {
    const now = Date.now()
    
    cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    })
  }

  /**
   * Удалить данные из кэша
   * @param key - Ключ кэша
   */
  const remove = (key: string): void => {
    cache.delete(key)
  }

  /**
   * Очистить весь кэш
   */
  const clear = (): void => {
    cache.clear()
  }

  /**
   * Проверить, есть ли данные в кэше и не истек ли срок
   * @param key - Ключ кэша
   */
  const has = (key: string): boolean => {
    const item = cache.get(key)
    
    if (!item) {
      return false
    }
    
    if (Date.now() > item.expiresAt) {
      cache.delete(key)
      return false
    }
    
    return true
  }

  /**
   * Получить или загрузить данные с кэшированием
   * @param key - Ключ кэша
   * @param fetcher - Функция для загрузки данных
   * @param ttl - Время жизни кэша в миллисекундах
   */
  const getOrFetch = async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // Проверяем кэш
    const cached = get<T>(key)
    if (cached !== null) {
      return cached
    }
    
    // Загружаем данные
    const data = await fetcher()
    
    // Сохраняем в кэш
    set(key, data, ttl)
    
    return data
  }

  /**
   * Инвалидировать кэш по паттерну
   * @param pattern - Регулярное выражение или строка для поиска ключей
   */
  const invalidate = (pattern: string | RegExp): void => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key)
      }
    }
  }

  return {
    get,
    set,
    remove,
    clear,
    has,
    getOrFetch,
    invalidate
  }
}
