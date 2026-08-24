import { addDays, daysBetween, endOfMonth, monthOf, startOfMonth, startOfWeek, type Day, type Month } from './calendar';
import { isScheduled, type Schedule } from './schedule';

export type MonthRateInput = {
  schedule: Schedule;
  completedDays: ReadonlySet<Day>;
  month: Month;
  weekStartsOn: number;
};

/**
 * Fracao de 0 a 1. No modo timesPerWeek a meta do mes e `N x semanas que tocam o mes` —
 * dividir por dias puniria quem cumpriu o combinado semanal.
 */
export function monthRate({ schedule, completedDays, month, weekStartsOn }: MonthRateInput): number {
  const first = startOfMonth(month);
  const last = endOfMonth(month);

  if (schedule.kind === 'timesPerWeek') {
    const goal = schedule.times * weeksTouching(first, last, weekStartsOn);
    if (goal === 0) return 0;
    return Math.min(1, completedIn(completedDays, month) / goal);
  }

  let scheduled = 0;
  let done = 0;

  for (let day = first; day <= last; day = addDays(day, 1)) {
    if (!isScheduled(schedule, day)) continue;
    scheduled++;
    if (completedDays.has(day)) done++;
  }

  return scheduled === 0 ? 0 : done / scheduled;
}

function completedIn(completedDays: ReadonlySet<Day>, month: Month): number {
  let done = 0;
  for (const day of completedDays) {
    if (monthOf(day) === month) done++;
  }
  return done;
}

function weeksTouching(first: Day, last: Day, weekStartsOn: number): number {
  const firstWeek = startOfWeek(first, weekStartsOn);
  const lastWeek = startOfWeek(last, weekStartsOn);
  return daysBetween(firstWeek, lastWeek) / 7 + 1;
}
