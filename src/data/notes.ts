import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/data/db';
import { uuidV7 } from '@/data/id';
import { dayNotes } from '@/data/schema';
import type { Day } from '@/domain/calendar';

export function notesOfHabit(habitId: string) {
  return db
    .select()
    .from(dayNotes)
    .where(and(eq(dayNotes.habitId, habitId), isNull(dayNotes.deletedAt)));
}

/** Nota vazia e nota apagada: soft delete, para o sync levar a remocao adiante. */
export async function saveNote(habitId: string, day: Day, text: string, now: Date): Promise<void> {
  const timestamp = now.toISOString();
  const trimmed = text.trim();

  const [existing] = await db
    .select()
    .from(dayNotes)
    .where(and(eq(dayNotes.habitId, habitId), eq(dayNotes.day, day)));

  if (!existing) {
    if (trimmed.length === 0) return;

    await db.insert(dayNotes).values({
      id: uuidV7(now),
      habitId,
      day,
      text: trimmed,
      updatedAt: timestamp,
      deletedAt: null,
    });
    return;
  }

  await db
    .update(dayNotes)
    .set({
      text: trimmed,
      updatedAt: timestamp,
      deletedAt: trimmed.length === 0 ? timestamp : null,
    })
    .where(eq(dayNotes.id, existing.id));
}
