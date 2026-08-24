import { addDays, type Day } from './calendar';
import { isScheduled, type Schedule } from './schedule';

export type HabitProgress = {
  schedule: Schedule;
  completedDays: ReadonlySet<Day>;
};

/**
 * Fracao dos habitos agendados no dia que foram cumpridos, ou `null` quando nada
 * estava agendado — dia neutro nao e dia zerado, e o anel precisa saber a diferenca.
 */
export function dayRatio(habits: HabitProgress[], day: Day): number | null {
  let scheduled = 0;
  let done = 0;

  for (const habit of habits) {
    if (!isScheduled(habit.schedule, day)) continue;
    scheduled++;
    if (habit.completedDays.has(day)) done++;
  }

  return scheduled === 0 ? null : done / scheduled;
}

/** Dia perfeito: havia pelo menos um habito agendado e todos foram cumpridos. */
export function isPerfectDay(habits: HabitProgress[], day: Day): boolean {
  return dayRatio(habits, day) === 1;
}

export function perfectDays(habits: HabitProgress[], from: Day, to: Day): number {
  let total = 0;

  for (let day = from; day <= to; day = addDays(day, 1)) {
    if (isPerfectDay(habits, day)) total++;
  }

  return total;
}
