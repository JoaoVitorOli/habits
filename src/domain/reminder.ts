import { weekdaysOf, type Schedule } from './schedule';

export type Time = { hour: number; minute: number };

/**
 * Lembrete so nos dias agendados. Sete lembretes semanais e um lembrete diario dizem a
 * mesma coisa para o usuario, mas o diario e uma linha no sistema em vez de sete.
 */
export type ReminderTrigger =
  | { kind: 'daily'; hour: number; minute: number }
  /** `weekday` no formato do dominio: 0 = domingo. Quem traduz para a plataforma e a borda. */
  | { kind: 'weekly'; weekday: number; hour: number; minute: number };

export function parseTime(value: string | null): Time | null {
  if (value === null) return null;

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return { hour, minute };
}

export function formatTime({ hour, minute }: Time): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function remindersFor(schedule: Schedule, reminderTime: string | null): ReminderTrigger[] {
  const time = parseTime(reminderTime);
  if (time === null) return [];

  if (schedule.kind === 'timesPerWeek') {
    return [{ kind: 'daily', hour: time.hour, minute: time.minute }];
  }

  const weekdays = weekdaysOf(schedule.days);
  if (weekdays.length === 0) return [];
  if (weekdays.length === 7) return [{ kind: 'daily', hour: time.hour, minute: time.minute }];

  return weekdays.map((weekday) => ({
    kind: 'weekly' as const,
    weekday,
    hour: time.hour,
    minute: time.minute,
  }));
}
