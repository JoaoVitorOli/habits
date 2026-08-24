import { describe, expect, it } from 'vitest';

import type { Schedule } from './schedule';
import { monthRate } from './stats';

/* Agosto de 2026 comeca num sabado. Com a agenda seg/qua/sex o mes tem 13 dias agendados:
   segundas 3, 10, 17, 24, 31 · quartas 5, 12, 19, 26 · sextas 7, 14, 21, 28. */
const segQuaSex: Schedule = { kind: 'daysOfWeek', days: 2 + 8 + 32 };
const tresPorSemana: Schedule = { kind: 'timesPerWeek', times: 3 };

function dias(...days: string[]): ReadonlySet<string> {
  return new Set(days);
}

describe('monthRate no modo daysOfWeek', () => {
  it('e a fracao dos dias agendados do mes que foram completos', () => {
    const rate = monthRate({
      schedule: segQuaSex,
      completedDays: dias('2026-08-03', '2026-08-05', '2026-08-07'),
      month: '2026-08',
      weekStartsOn: 0,
    });
    expect(rate).toBeCloseTo(3 / 13);
  });

  it('ignora marcacao em dia nao agendado', () => {
    // 04/08 e uma terca: nao esta na agenda e nao pode inflar a taxa
    const rate = monthRate({
      schedule: segQuaSex,
      completedDays: dias('2026-08-03', '2026-08-04'),
      month: '2026-08',
      weekStartsOn: 0,
    });
    expect(rate).toBeCloseTo(1 / 13);
  });

  it('ignora marcacao de outro mes', () => {
    const rate = monthRate({
      schedule: segQuaSex,
      completedDays: dias('2026-07-31', '2026-08-03'),
      month: '2026-08',
      weekStartsOn: 0,
    });
    expect(rate).toBeCloseTo(1 / 13);
  });

  it('mes sem dia agendado vale zero, nao divisao por zero', () => {
    const rate = monthRate({
      schedule: { kind: 'daysOfWeek', days: 0 },
      completedDays: dias('2026-08-03'),
      month: '2026-08',
      weekStartsOn: 0,
    });
    expect(rate).toBe(0);
  });
});

describe('monthRate no modo timesPerWeek', () => {
  it('divide pelas semanas que tocam o mes, nao pelos dias', () => {
    // agosto e tocado por 6 semanas (26/07, 02, 09, 16, 23 e 30/08): meta de 18 marcacoes
    const rate = monthRate({
      schedule: tresPorSemana,
      completedDays: dias(
        '2026-08-03', '2026-08-04', '2026-08-05',
        '2026-08-10', '2026-08-11', '2026-08-12',
        '2026-08-17', '2026-08-18', '2026-08-19',
      ),
      month: '2026-08',
      weekStartsOn: 0,
    });
    expect(rate).toBeCloseTo(9 / 18);
  });

  it('passar da meta nao passa de 100%', () => {
    const days = Array.from({ length: 20 }, (_, index) => `2026-08-${String(index + 1).padStart(2, '0')}`);
    const rate = monthRate({
      schedule: tresPorSemana,
      completedDays: new Set(days),
      month: '2026-08',
      weekStartsOn: 0,
    });
    expect(rate).toBe(1);
  });

  it('o inicio da semana muda quantas semanas tocam o mes', () => {
    // com a semana comecando na segunda, agosto de 2026 e tocado por 6 semanas tambem,
    // mas julho de 2026 (comeca numa quarta) e tocado por 5 com domingo e 5 com segunda
    const rate = monthRate({
      schedule: tresPorSemana,
      completedDays: dias('2026-07-01', '2026-07-02', '2026-07-03'),
      month: '2026-07',
      weekStartsOn: 1,
    });
    expect(rate).toBeCloseTo(3 / 15);
  });
});
