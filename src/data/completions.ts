import { and, eq, gte, isNull } from 'drizzle-orm';

import { db } from '@/data/db';
import { uuidV7 } from '@/data/id';
import { completions, type HabitRow } from '@/data/schema';
import type { Day } from '@/domain/calendar';

/** Query viva da janela que a home desenha. */
export function completionsSince(from: Day) {
  return db
    .select()
    .from(completions)
    .where(and(isNull(completions.deletedAt), gte(completions.day, from)));
}

/**
 * Uma linha por (habito, dia) com `count`. Isso torna a marcacao idempotente e da ao
 * sync uma linha canonica por dia. Ao bater a meta, o proximo toque zera.
 */
export async function toggleCompletion(habit: HabitRow, day: Day, now: Date): Promise<void> {
  const timestamp = now.toISOString();
  const [existing] = await db
    .select()
    .from(completions)
    .where(and(eq(completions.habitId, habit.id), eq(completions.day, day)));

  if (!existing) {
    await db.insert(completions).values({
      id: uuidV7(now),
      habitId: habit.id,
      day,
      count: 1,
      completedAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    });
    return;
  }

  const count = existing.count >= habit.targetPerDay ? 0 : existing.count + 1;

  await db
    .update(completions)
    .set({ count, completedAt: timestamp, updatedAt: timestamp, deletedAt: null })
    .where(eq(completions.id, existing.id));
}
