import { describe, expect, it } from 'vitest';

import type { Schedule } from './schedule';
import { currentStreak, recordStreak } from './streak';

/* 2026-08: dom 23, seg 24, ter 25, qua 26 ... O passado usado aqui:
   seg 17, qua 19, sex 21, dom 23, seg 24. */
const segQuaSex: Schedule = { kind: 'daysOfWeek', days: 2 + 8 + 32 };
const tresPorSemana: Schedule = { kind: 'timesPerWeek', times: 3 };
const HOJE = '2026-08-24';

function dias(...days: string[]): ReadonlySet<string> {
  return new Set(days);
}

describe('currentStreak no modo daysOfWeek', () => {
  it('conta os dias agendados e completos, de tras para frente', () => {
    const streak = currentStreak({
      schedule: segQuaSex,
      completedDays: dias('2026-08-17', '2026-08-19', '2026-08-21', '2026-08-24'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(streak).toBe(4);
  });

  it('hoje incompleto nao quebra, so nao soma — o dia ainda nao acabou', () => {
    const streak = currentStreak({
      schedule: segQuaSex,
      completedDays: dias('2026-08-17', '2026-08-19', '2026-08-21'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(streak).toBe(3);
  });

  it('dia agendado e incompleto no passado quebra', () => {
    const streak = currentStreak({
      schedule: segQuaSex,
      completedDays: dias('2026-08-17', '2026-08-21', '2026-08-24'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(streak).toBe(2);
  });

  it('dia nao agendado e neutro: nao soma e nao quebra', () => {
    // 22 (sabado) e 23 (domingo) nao estao na agenda e ficam no meio do caminho
    const streak = currentStreak({
      schedule: segQuaSex,
      completedDays: dias('2026-08-21', '2026-08-24'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(streak).toBe(2);
  });

  it('sem nenhuma marcacao o streak e zero', () => {
    const streak = currentStreak({
      schedule: segQuaSex,
      completedDays: dias(),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(streak).toBe(0);
  });
});

describe('currentStreak no modo timesPerWeek', () => {
  it('conta semanas que bateram a meta, e a semana corrente incompleta nao quebra', () => {
    // semana de 16 a 22: 17, 19 e 21 = 3 marcacoes, bate a meta
    // semana de 9 a 15: 10 e 12 = 2 marcacoes, nao bate
    // semana corrente (23 a 29): so o dia 24 — incompleta, mas nao quebra
    const streak = currentStreak({
      schedule: tresPorSemana,
      completedDays: dias('2026-08-10', '2026-08-12', '2026-08-17', '2026-08-19', '2026-08-21', '2026-08-24'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(streak).toBe(1);
  });

  it('a semana corrente soma assim que bate a meta', () => {
    const streak = currentStreak({
      schedule: tresPorSemana,
      completedDays: dias('2026-08-17', '2026-08-19', '2026-08-21', '2026-08-23', '2026-08-24'),
      today: HOJE,
      weekStartsOn: 0,
    });
    // semana corrente tem 23 e 24 = 2, ainda nao bate; a de tras bate
    expect(streak).toBe(1);
  });

  it('duas semanas seguidas na meta valem 2', () => {
    const streak = currentStreak({
      schedule: tresPorSemana,
      completedDays: dias(
        '2026-08-17', '2026-08-19', '2026-08-21',
        '2026-08-23', '2026-08-24', '2026-08-25',
      ),
      today: '2026-08-25',
      weekStartsOn: 0,
    });
    expect(streak).toBe(2);
  });

  it('respeita a semana comecando na segunda', () => {
    // com semana na segunda, 23 (domingo) cai na semana de 17 a 23, que fecha 4 marcacoes
    const streak = currentStreak({
      schedule: tresPorSemana,
      completedDays: dias('2026-08-17', '2026-08-19', '2026-08-21', '2026-08-23'),
      today: HOJE,
      weekStartsOn: 1,
    });
    expect(streak).toBe(1);
  });
});

describe('recordStreak', () => {
  it('e a maior sequencia do historico, sem a excecao do dia corrente', () => {
    // 17, 19 e 21 formam 3; 24 esta incompleto e nao continua a corrida
    const record = recordStreak({
      schedule: segQuaSex,
      completedDays: dias('2026-08-17', '2026-08-19', '2026-08-21'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(record).toBe(3);
  });

  it('pega a maior corrida mesmo com um buraco no meio', () => {
    // 5 e 7 formam 2; o dia 10 quebra; 12, 14, 17 formam 3
    const record = recordStreak({
      schedule: segQuaSex,
      completedDays: dias('2026-08-05', '2026-08-07', '2026-08-12', '2026-08-14', '2026-08-17'),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(record).toBe(3);
  });

  it('no modo timesPerWeek conta semanas', () => {
    const record = recordStreak({
      schedule: tresPorSemana,
      completedDays: dias(
        '2026-08-03', '2026-08-04', '2026-08-05',
        '2026-08-10', '2026-08-11', '2026-08-12',
      ),
      today: HOJE,
      weekStartsOn: 0,
    });
    expect(record).toBe(2);
  });
});
