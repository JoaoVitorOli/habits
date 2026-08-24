import { and, asc, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import { db } from '@/data/db';
import { uuidV7 } from '@/data/id';
import { completions, dayNotes, habits, type HabitRow } from '@/data/schema';
import type { Schedule } from '@/domain/schedule';
import type { PaletteKey } from '@/domain/palette';

export type NewHabit = {
  name: string;
  description: string | null;
  icon: string;
  color: PaletteKey;
  schedule: Schedule;
  targetPerDay: number;
  streakGoal: number | null;
};

/** Query viva: a home re-renderiza sozinha quando a tabela muda. */
export const activeHabitsQuery = db
  .select()
  .from(habits)
  .where(and(isNull(habits.deletedAt), isNull(habits.archivedAt)))
  .orderBy(asc(habits.position));

export const archivedHabitsQuery = db
  .select()
  .from(habits)
  .where(and(isNull(habits.deletedAt), isNotNull(habits.archivedAt)))
  .orderBy(asc(habits.position));

export function habitByIdQuery(id: string) {
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.id, id), isNull(habits.deletedAt)));
}

export async function createHabit(input: NewHabit, now: Date): Promise<HabitRow> {
  const timestamp = now.toISOString();
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${habits.position}), -1) + 1` })
    .from(habits)
    .where(isNull(habits.deletedAt));

  const row = {
    id: uuidV7(now),
    userId: null,
    name: input.name,
    description: input.description,
    icon: input.icon,
    color: input.color,
    scheduleKind: input.schedule.kind,
    scheduleDays: input.schedule.kind === 'daysOfWeek' ? input.schedule.days : null,
    scheduleTimes: input.schedule.kind === 'timesPerWeek' ? input.schedule.times : null,
    targetPerDay: input.targetPerDay,
    streakGoal: input.streakGoal,
    reminderTime: null,
    position: next,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };

  await db.insert(habits).values(row);
  return row;
}

export function scheduleOf(row: HabitRow): Schedule {
  return row.scheduleKind === 'timesPerWeek'
    ? { kind: 'timesPerWeek', times: row.scheduleTimes ?? 1 }
    : { kind: 'daysOfWeek', days: row.scheduleDays ?? 0 };
}

export async function updateHabit(id: string, input: NewHabit, now: Date): Promise<void> {
  await db
    .update(habits)
    .set({
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      scheduleKind: input.schedule.kind,
      scheduleDays: input.schedule.kind === 'daysOfWeek' ? input.schedule.days : null,
      scheduleTimes: input.schedule.kind === 'timesPerWeek' ? input.schedule.times : null,
      targetPerDay: input.targetPerDay,
      streakGoal: input.streakGoal,
      updatedAt: now.toISOString(),
    })
    .where(eq(habits.id, id));
}

export async function archiveHabit(id: string, now: Date): Promise<void> {
  const timestamp = now.toISOString();
  await db.update(habits).set({ archivedAt: timestamp, updatedAt: timestamp }).where(eq(habits.id, id));
}

export async function restoreHabit(id: string, now: Date): Promise<void> {
  await db
    .update(habits)
    .set({ archivedAt: null, updatedAt: now.toISOString() })
    .where(eq(habits.id, id));
}

/**
 * Soft delete: as linhas somem da UI mas continuam existindo para o sync levar a exclusao
 * adiante. O historico vai junto — senao marcacoes e notas ficariam orfas para sempre,
 * e a confirmacao promete que elas somem.
 */
export async function deleteHabit(id: string, now: Date): Promise<void> {
  const timestamp = now.toISOString();
  const deleted = { deletedAt: timestamp, updatedAt: timestamp };

  await db.transaction(async (tx) => {
    await tx.update(habits).set(deleted).where(eq(habits.id, id));
    await tx.update(completions).set(deleted).where(eq(completions.habitId, id));
    await tx.update(dayNotes).set(deleted).where(eq(dayNotes.habitId, id));
  });
}

/** `position` sincroniza, entao reordenar reescreve a coluna inteira e nao um indice relativo. */
export async function reorderHabits(orderedIds: string[], now: Date): Promise<void> {
  const timestamp = now.toISOString();

  await db.transaction(async (tx) => {
    for (const [position, id] of orderedIds.entries()) {
      await tx.update(habits).set({ position, updatedAt: timestamp }).where(eq(habits.id, id));
    }
  });
}

export async function updateStreakGoal(id: string, streakGoal: number | null, now: Date): Promise<void> {
  await db
    .update(habits)
    .set({ streakGoal, updatedAt: now.toISOString() })
    .where(eq(habits.id, id));
}
