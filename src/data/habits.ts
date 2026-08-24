import { and, asc, isNull, sql } from 'drizzle-orm';

import { db } from '@/data/db';
import { uuidV7 } from '@/data/id';
import { habits, type HabitRow } from '@/data/schema';
import type { Schedule } from '@/domain/schedule';
import type { PaletteKey } from '@/ui/theme';

export type NewHabit = {
  name: string;
  description: string | null;
  icon: string;
  color: PaletteKey;
  schedule: Schedule;
  targetPerDay: number;
};

/** Query viva: a home re-renderiza sozinha quando a tabela muda. */
export const activeHabitsQuery = db
  .select()
  .from(habits)
  .where(and(isNull(habits.deletedAt), isNull(habits.archivedAt)))
  .orderBy(asc(habits.position));

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
    streakGoal: null,
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
