/**
 * O widget nunca consulta o SQLite: o contexto headless nao garante acesso ao banco.
 * Ele le este snapshot, que o app reescreve a cada mutacao. Por isso o formato e fechado
 * e versionado — um snapshot de outra versao e descartado, nao adivinhado.
 */
import { addDays, type Day } from './calendar';
import type { Preferences } from './preferences';
import type { Schedule } from './schedule';
import { currentStreak, streakUnit } from './streak';

export const SNAPSHOT_VERSION = 3;

/** Cabe a grade mais longa do widget com folga, e mantem o JSON pequeno. */
export const SNAPSHOT_DAYS = 120;

export type SnapshotHabit = {
  id: string;
  name: string;
  /** o widget medio mostra a descricao onde o pequeno nao teria largura para ela */
  description: string | null;
  icon: string;
  color: string;
  targetPerDay: number;
  currentStreak: number;
  /** o compromisso de `timesPerWeek` e semanal: a sequencia dele conta semanas, nao dias */
  streakUnit: 'dias' | 'semanas';
  /** so os dias marcados dentro da janela: `{ '2026-08-24': 1 }` */
  days: Record<Day, number>;
};

export type WidgetSnapshot = {
  v: number;
  generatedAt: string;
  /**
   * O headless nao le o SQLite, entao a virada do dia e o inicio da semana viajam no arquivo:
   * sem isso o widget desenharia a semana de um jeito e o app de outro.
   */
  dayStartHour: number;
  weekStartsOn: number;
  habits: SnapshotHabit[];
};

export type SnapshotHabitInput = {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  targetPerDay: number;
  schedule: Schedule;
};

export type SnapshotCompletion = {
  habitId: string;
  day: Day;
  count: number;
};

export type BuildSnapshotInput = {
  habits: SnapshotHabitInput[];
  /** historico inteiro: a janela corta o que vai para o arquivo, nao o que conta a sequencia */
  completions: SnapshotCompletion[];
  today: Day;
  preferences: Preferences;
  generatedAt: Date;
};

export function buildSnapshot({
  habits,
  completions,
  today,
  preferences,
  generatedAt,
}: BuildSnapshotInput): WidgetSnapshot {
  const windowStart = addDays(today, -(SNAPSHOT_DAYS - 1));
  const { dayStartHour, weekStartsOn } = preferences;

  return {
    v: SNAPSHOT_VERSION,
    generatedAt: generatedAt.toISOString(),
    dayStartHour,
    weekStartsOn,
    habits: habits.map((habit) => {
      const mine = completions.filter((completion) => completion.habitId === habit.id);
      const days: Record<Day, number> = {};
      const completedDays = new Set<Day>();

      for (const { day, count } of mine) {
        if (count >= habit.targetPerDay) completedDays.add(day);
        if (count > 0 && day >= windowStart) days[day] = count;
      }

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        icon: habit.icon,
        color: habit.color,
        targetPerDay: habit.targetPerDay,
        currentStreak: currentStreak({ schedule: habit.schedule, completedDays, today, weekStartsOn }),
        streakUnit: streakUnit(habit.schedule),
        days,
      };
    }),
  };
}

export function isDone(habit: SnapshotHabit, day: Day): boolean {
  return (habit.days[day] ?? 0) >= habit.targetPerDay;
}

/**
 * Mesma regra do banco, para o widget poder desenhar o toque antes da gravacao terminar.
 * A sequencia nao e recalculada aqui: ela volta certa no snapshot que o app reescreve logo
 * em seguida, e chutar um numero seria mostrar um valor que nunca existiu.
 */
export function toggleDay(habit: SnapshotHabit, day: Day): SnapshotHabit {
  const count = isDone(habit, day) ? 0 : (habit.days[day] ?? 0) + 1;
  return { ...habit, days: { ...habit.days, [day]: count } };
}

export function habitOf(snapshot: WidgetSnapshot | null, habitId: string | null): SnapshotHabit | null {
  if (snapshot === null || habitId === null) return null;
  return snapshot.habits.find((habit) => habit.id === habitId) ?? null;
}

/**
 * A lista compacta nao pergunta qual habito: mostra os ativos na ordem em que o app os
 * mostra, cortados pelo numero de linhas que couberam na altura medida do widget.
 */
export function habitsOf(snapshot: WidgetSnapshot | null, limit: number): SnapshotHabit[] {
  if (snapshot === null || limit <= 0) return [];
  return snapshot.habits.slice(0, limit);
}

/**
 * O toque otimista mexe no snapshot inteiro, nao num habito solto: a lista compacta desenha
 * varios habitos de uma vez, e so um deles mudou.
 */
export function toggleHabit(
  snapshot: WidgetSnapshot | null,
  habitId: string,
  day: Day,
): WidgetSnapshot | null {
  if (snapshot === null) return null;
  return {
    ...snapshot,
    habits: snapshot.habits.map((habit) => (habit.id === habitId ? toggleDay(habit, day) : habit)),
  };
}

export function parseSnapshot(raw: string | null): WidgetSnapshot | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const snapshot = parsed as WidgetSnapshot;
    if (snapshot.v !== SNAPSHOT_VERSION || !Array.isArray(snapshot.habits)) return null;

    return snapshot;
  } catch {
    return null;
  }
}
