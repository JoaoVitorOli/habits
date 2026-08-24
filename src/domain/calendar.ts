/**
 * Dia logico do app. Um dia e sempre a string local `YYYY-MM-DD` — nunca um timestamp,
 * nunca UTC. `toISOString()` converteria para UTC e erraria o dia.
 */
export type Day = string;

const MS_PER_DAY = 86_400_000;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toDay(date: Date): Day {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Meio-dia local: imune a qualquer salto de horario de verao na aritmetica de dias. */
function noonOf(day: Day): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 12);
}

export function logicalDay(at: Date, dayStartHour: number): Day {
  const shifted = new Date(at.getTime());
  shifted.setHours(shifted.getHours() - dayStartHour);
  return toDay(shifted);
}

export function addDays(day: Day, delta: number): Day {
  const date = noonOf(day);
  date.setDate(date.getDate() + delta);
  return toDay(date);
}

export function weekdayOf(day: Day): number {
  return noonOf(day).getDay();
}

export function daysBetween(from: Day, to: Day): number {
  return Math.round((noonOf(to).getTime() - noonOf(from).getTime()) / MS_PER_DAY);
}

export function startOfWeek(day: Day, weekStartsOn: number): Day {
  const offset = (weekdayOf(day) - weekStartsOn + 7) % 7;
  return addDays(day, -offset);
}
