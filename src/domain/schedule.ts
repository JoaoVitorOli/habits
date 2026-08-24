import { weekdayOf, type Day } from './calendar';

/**
 * `daysOfWeek` compromete dias fixos; `timesPerWeek` compromete uma quantidade na semana,
 * e por isso todo dia e elegivel.
 */
export type Schedule =
  | { kind: 'daysOfWeek'; days: number }
  | { kind: 'timesPerWeek'; times: number };

/** Mascara de bits: domingo = 1, segunda = 2, ... sabado = 64. */
export function weekdayBit(weekday: number): number {
  return 1 << weekday;
}

export function weekdaysOf(mask: number): number[] {
  const weekdays: number[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if ((mask & weekdayBit(weekday)) !== 0) weekdays.push(weekday);
  }
  return weekdays;
}

export function toggleWeekday(mask: number, weekday: number): number {
  return mask ^ weekdayBit(weekday);
}

export function isScheduled(schedule: Schedule, day: Day): boolean {
  if (schedule.kind === 'timesPerWeek') return true;
  return (schedule.days & weekdayBit(weekdayOf(day))) !== 0;
}

/**
 * A linha do banco guarda a agenda em duas colunas, so uma delas preenchida. Quem le a
 * linha quer um valor so — home, detalhe, lembretes e widget faziam essa traducao cada um
 * do seu jeito.
 */
export function scheduleOf(row: {
  scheduleKind: string;
  scheduleDays: number | null;
  scheduleTimes: number | null;
}): Schedule {
  return row.scheduleKind === 'timesPerWeek'
    ? { kind: 'timesPerWeek', times: row.scheduleTimes ?? 1 }
    : { kind: 'daysOfWeek', days: row.scheduleDays ?? 0 };
}
