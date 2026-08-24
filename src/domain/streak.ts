import { addDays, startOfWeek, type Day } from './calendar';
import { isScheduled, type Schedule } from './schedule';

export type StreakInput = {
  schedule: Schedule;
  /** dias que bateram `targetPerDay`. Quem sabe a meta e a borda, nao o dominio. */
  completedDays: ReadonlySet<Day>;
  today: Day;
  weekStartsOn: number;
};

/** No modo timesPerWeek a unidade e a semana, nao o dia. */
export function streakUnit(schedule: Schedule): 'dias' | 'semanas' {
  return schedule.kind === 'timesPerWeek' ? 'semanas' : 'dias';
}

/** Progresso da meta de sequencia, de 0 a 1. Sem meta nao ha barra para desenhar. */
export function goalProgress(current: number, goal: number | null): number | null {
  if (goal === null || goal <= 0) return null;
  return Math.min(1, current / goal);
}

export function currentStreak(input: StreakInput): number {
  const first = earliestOf(input.completedDays);
  if (first === null) return 0;

  return input.schedule.kind === 'timesPerWeek'
    ? currentWeeks(input, first, input.schedule.times)
    : currentDays(input, first);
}

export function recordStreak(input: StreakInput): number {
  const first = earliestOf(input.completedDays);
  if (first === null) return 0;

  return input.schedule.kind === 'timesPerWeek'
    ? recordWeeks(input, first, input.schedule.times)
    : recordDays(input, first);
}

function currentDays({ schedule, completedDays, today }: StreakInput, first: Day): number {
  let streak = 0;

  for (let day = today; day >= first; day = addDays(day, -1)) {
    if (!isScheduled(schedule, day)) continue;
    if (completedDays.has(day)) {
      streak++;
      continue;
    }
    // hoje incompleto nao quebra: o dia ainda nao acabou
    if (day === today) continue;
    break;
  }

  return streak;
}

function recordDays({ schedule, completedDays, today }: StreakInput, first: Day): number {
  let record = 0;
  let run = 0;

  for (let day = first; day <= today; day = addDays(day, 1)) {
    if (!isScheduled(schedule, day)) continue;
    run = completedDays.has(day) ? run + 1 : 0;
    record = Math.max(record, run);
  }

  return record;
}

function currentWeeks({ completedDays, today, weekStartsOn }: StreakInput, first: Day, times: number): number {
  const tally = tallyByWeek(completedDays, weekStartsOn);
  const firstWeek = startOfWeek(first, weekStartsOn);
  const currentWeek = startOfWeek(today, weekStartsOn);
  let streak = 0;

  for (let week = currentWeek; week >= firstWeek; week = addDays(week, -7)) {
    if ((tally.get(week) ?? 0) >= times) {
      streak++;
      continue;
    }
    // mesma excecao do dia corrente, uma semana acima
    if (week === currentWeek) continue;
    break;
  }

  return streak;
}

function recordWeeks({ completedDays, today, weekStartsOn }: StreakInput, first: Day, times: number): number {
  const tally = tallyByWeek(completedDays, weekStartsOn);
  const currentWeek = startOfWeek(today, weekStartsOn);
  let record = 0;
  let run = 0;

  for (let week = startOfWeek(first, weekStartsOn); week <= currentWeek; week = addDays(week, 7)) {
    run = (tally.get(week) ?? 0) >= times ? run + 1 : 0;
    record = Math.max(record, run);
  }

  return record;
}

function tallyByWeek(days: ReadonlySet<Day>, weekStartsOn: number): Map<Day, number> {
  const tally = new Map<Day, number>();

  for (const day of days) {
    const week = startOfWeek(day, weekStartsOn);
    tally.set(week, (tally.get(week) ?? 0) + 1);
  }

  return tally;
}

function earliestOf(days: ReadonlySet<Day>): Day | null {
  let earliest: Day | null = null;
  for (const day of days) {
    if (earliest === null || day < earliest) earliest = day;
  }
  return earliest;
}
