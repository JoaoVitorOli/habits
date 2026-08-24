import { describe, expect, it } from 'vitest';

import { formatTime, parseTime, remindersFor } from './reminder';
import type { Schedule } from './schedule';

const segQuaSex: Schedule = { kind: 'daysOfWeek', days: 2 + 8 + 32 };
const todoDia: Schedule = { kind: 'daysOfWeek', days: 127 };
const tresPorSemana: Schedule = { kind: 'timesPerWeek', times: 3 };

describe('parseTime', () => {
  it('le HH:mm', () => {
    expect(parseTime('07:05')).toEqual({ hour: 7, minute: 5 });
  });

  it('sem lembrete nao ha horario', () => {
    expect(parseTime(null)).toBe(null);
  });

  it('texto invalido nao vira horario torto', () => {
    expect(parseTime('25:00')).toBe(null);
    expect(parseTime('07:60')).toBe(null);
    expect(parseTime('sete horas')).toBe(null);
  });
});

describe('formatTime', () => {
  it('preenche com zero a esquerda', () => {
    expect(formatTime({ hour: 7, minute: 5 })).toBe('07:05');
  });
});

describe('remindersFor', () => {
  it('sem horario nao gera lembrete', () => {
    expect(remindersFor(segQuaSex, null)).toEqual([]);
  });

  it('gera um lembrete semanal por dia agendado', () => {
    // domingo e 0 no dominio: segunda 1, quarta 3, sexta 5
    expect(remindersFor(segQuaSex, '07:30')).toEqual([
      { kind: 'weekly', weekday: 1, hour: 7, minute: 30 },
      { kind: 'weekly', weekday: 3, hour: 7, minute: 30 },
      { kind: 'weekly', weekday: 5, hour: 7, minute: 30 },
    ]);
  });

  it('agenda de todo dia vira um lembrete diario, nao sete semanais', () => {
    expect(remindersFor(todoDia, '21:00')).toEqual([{ kind: 'daily', hour: 21, minute: 0 }]);
  });

  it('no modo timesPerWeek o lembrete e diario, porque todo dia e elegivel', () => {
    expect(remindersFor(tresPorSemana, '21:00')).toEqual([{ kind: 'daily', hour: 21, minute: 0 }]);
  });

  it('agenda sem nenhum dia nao gera lembrete', () => {
    expect(remindersFor({ kind: 'daysOfWeek', days: 0 }, '07:30')).toEqual([]);
  });
});
