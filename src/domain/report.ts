/**
 * Relatorio legivel: o que o backup JSON guarda para a maquina, isto conta para uma pessoa.
 * Nao volta para dentro do app — a importacao le o JSON, nunca isto — entao aqui nao existe
 * contrato com o passado: o formato pode mudar quando ficar melhor de ler.
 */
import { monthOf, weekdayOf, toDay, type Day, type Month } from './calendar';

export type ReportHabit = {
  id: string;
  name: string;
  targetPerDay: number;
  archivedAt: string | null;
  deletedAt: string | null;
};

export type ReportCompletion = {
  habitId: string;
  day: Day;
  count: number;
  deletedAt: string | null;
};

export type ReportNote = {
  habitId: string;
  day: Day;
  text: string;
  deletedAt: string | null;
};

export type ReportInput = {
  habits: ReportHabit[];
  completions: ReportCompletion[];
  dayNotes: ReportNote[];
};

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** O dia que aparece no relatorio: o que foi marcado, o que foi escrito, ou os dois. */
type ReportDay = { day: Day; count: number; note: string | null };

export function buildReport(input: ReportInput, now: Date): string {
  const today = toDay(now);
  const [year, month, date] = today.split('-').map(Number);
  const lines = [`# Hábitos — ${date} de ${MONTH_NAMES[month - 1]} de ${year}`, ''];

  const habits = input.habits.filter((habit) => habit.deletedAt === null);

  for (const habit of habits) {
    lines.push(`## ${habit.name}${habit.archivedAt === null ? '' : ' (arquivado)'}`, '');
    lines.push(...habitLines(habit, daysOf(habit, input)));
  }

  return lines.join('\n');
}

function habitLines(habit: ReportHabit, days: ReportDay[]): string[] {
  if (days.length === 0) return ['Nada registrado ainda.', ''];

  const done = days.filter((day) => day.count >= habit.targetPerDay).length;
  const notes = days.filter((day) => day.note !== null).length;
  const lines = [`${plural(done, 'dia feito', 'dias feitos')} · ${plural(notes, 'nota', 'notas')}`, ''];

  let current: Month | null = null;

  for (const day of days) {
    const month = monthOf(day.day);

    if (month !== current) {
      if (current !== null) lines.push('');
      lines.push(`### ${monthLabel(month)}`, '');
      current = month;
    }

    lines.push(dayLine(habit, day));
  }

  lines.push('');
  return lines;
}

function dayLine(habit: ReportHabit, entry: ReportDay): string {
  const parts = [`- **${WEEKDAY_SHORT[weekdayOf(entry.day)]}, ${dayLabel(entry.day)}** — ${status(habit, entry.count)}`];
  if (entry.note !== null) parts.push(entry.note);
  return parts.join(' · ');
}

function status(habit: ReportHabit, count: number): string {
  if (count >= habit.targetPerDay) return 'feito';
  if (count === 0) return 'não feito';
  return `${count} de ${habit.targetPerDay}`;
}

/** Um dia por linha, do mais novo para o mais velho: e assim que se rele um diario. */
function daysOf(habit: ReportHabit, input: ReportInput): ReportDay[] {
  const byDay = new Map<Day, ReportDay>();

  for (const completion of input.completions) {
    if (completion.habitId !== habit.id || completion.deletedAt !== null) continue;
    if (completion.count === 0) continue;
    byDay.set(completion.day, { day: completion.day, count: completion.count, note: null });
  }

  for (const note of input.dayNotes) {
    if (note.habitId !== habit.id || note.deletedAt !== null) continue;
    const existing = byDay.get(note.day);
    byDay.set(note.day, { day: note.day, count: existing?.count ?? 0, note: note.text });
  }

  return [...byDay.values()].sort((left, right) => right.day.localeCompare(left.day));
}

function monthLabel(month: Month): string {
  const [year, index] = month.split('-').map(Number);
  return `${MONTH_NAMES[index - 1]} de ${year}`;
}

function dayLabel(day: Day): string {
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
}

function plural(count: number, singular: string, many: string): string {
  return `${count} ${count === 1 ? singular : many}`;
}
