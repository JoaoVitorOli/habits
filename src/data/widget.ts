import AsyncStorage from '@react-native-async-storage/async-storage';
import { and, isNull } from 'drizzle-orm';

import { db } from '@/data/db';
import { completions, habits } from '@/data/schema';
import type { Day } from '@/domain/calendar';
import type { Preferences } from '@/domain/preferences';
import { scheduleOf } from '@/domain/schedule';
import { buildSnapshot, parseSnapshot, type WidgetSnapshot } from '@/domain/widget-snapshot';

const SNAPSHOT_KEY = 'widget.snapshot';

/** Cada widget na tela inicial guarda o habito escolhido na hora de adicionar. */
function habitKey(widgetId: number): string {
  return `widget.habito.${widgetId}`;
}

export async function readWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  return parseSnapshot(await AsyncStorage.getItem(SNAPSHOT_KEY));
}

/**
 * Le o banco inteiro de uma vez: sao poucos habitos e a alternativa seria uma query por
 * widget. O historico completo entra no calculo da sequencia; a janela corta so o que vai
 * para o arquivo.
 */
export async function saveWidgetSnapshot(
  today: Day,
  preferences: Preferences,
  now: Date,
): Promise<WidgetSnapshot> {
  const rows = await db
    .select()
    .from(habits)
    .where(and(isNull(habits.deletedAt), isNull(habits.archivedAt)));

  const marks = await db.select().from(completions).where(isNull(completions.deletedAt));

  const snapshot = buildSnapshot({
    habits: rows.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      targetPerDay: row.targetPerDay,
      schedule: scheduleOf(row),
    })),
    completions: marks.map((mark) => ({ habitId: mark.habitId, day: mark.day, count: mark.count })),
    today,
    preferences,
    generatedAt: now,
  });

  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export async function widgetHabitId(widgetId: number): Promise<string | null> {
  return AsyncStorage.getItem(habitKey(widgetId));
}

export async function setWidgetHabit(widgetId: number, habitId: string): Promise<void> {
  await AsyncStorage.setItem(habitKey(widgetId), habitId);
}

export async function forgetWidgetHabit(widgetId: number): Promise<void> {
  await AsyncStorage.removeItem(habitKey(widgetId));
}
