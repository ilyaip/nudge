import { db } from '../db'
import { contacts, users } from '../db/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Находит linkedUserId по telegramContactId
 * Возвращает ID пользователя если он зарегистрирован в системе
 */
export async function findLinkedUserId(telegramContactId: string): Promise<number | null> {
  const [linkedUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramId, telegramContactId))
    .limit(1)

  return linkedUser?.id ?? null
}

/**
 * Проверяет и обновляет взаимные связи между пользователями
 * Если пользователь A добавил B и B добавил A, обе записи помечаются как взаимные
 */
export async function checkAndUpdateMutualConnection(
  userId: number,
  linkedUserId: number
): Promise<boolean> {
  // Проверяем, есть ли обратная связь (linkedUser добавил текущего пользователя)
  const [reverseContact] = await db
    .select()
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, linkedUserId),
        eq(contacts.linkedUserId, userId)
      )
    )
    .limit(1)

  if (reverseContact) {
    // Обновляем обе записи как взаимные
    await db
      .update(contacts)
      .set({ isMutual: true })
      .where(
        and(
          eq(contacts.userId, userId),
          eq(contacts.linkedUserId, linkedUserId)
        )
      )

    await db
      .update(contacts)
      .set({ isMutual: true })
      .where(
        and(
          eq(contacts.userId, linkedUserId),
          eq(contacts.linkedUserId, userId)
        )
      )

    return true
  }

  return false
}
