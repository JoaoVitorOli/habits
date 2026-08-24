import { describe, expect, it } from 'vitest';

import { dayRatio, isPerfectDay, perfectDays, type HabitProgress } from './overview';

/* 17/08/2026 e segunda, 18 terca, 19 quarta, 20 quinta. */
const treino: HabitProgress = {
  schedule: { kind: 'daysOfWeek', days: 2 + 8 + 32 },
  completedDays: new Set(['2026-08-17', '2026-08-19']),
};

const leitura: HabitProgress = {
  schedule: { kind: 'timesPerWeek', times: 3 },
  completedDays: new Set(['2026-08-17', '2026-08-18']),
};

describe('dayRatio', () => {
  it('e a fracao dos habitos agendados no dia que foram cumpridos', () => {
    // quarta: treino cumpriu, leitura nao
    expect(dayRatio([treino, leitura], '2026-08-19')).toBe(0.5);
  });

  it('conta so quem estava agendado', () => {
    // terca: treino nao esta na agenda, entao o dia depende so da leitura
    expect(dayRatio([treino, leitura], '2026-08-18')).toBe(1);
  });

  it('dia sem nenhum habito agendado nao tem taxa, e nao zero', () => {
    expect(dayRatio([treino], '2026-08-18')).toBe(null);
  });

  it('sem habito nenhum tambem nao tem taxa', () => {
    expect(dayRatio([], '2026-08-18')).toBe(null);
  });
});

describe('isPerfectDay', () => {
  it('e o dia em que todos os agendados foram cumpridos', () => {
    expect(isPerfectDay([treino, leitura], '2026-08-17')).toBe(true);
  });

  it('nao e perfeito se alguem agendado ficou para tras', () => {
    expect(isPerfectDay([treino, leitura], '2026-08-19')).toBe(false);
  });

  it('dia sem hábito agendado nao e perfeito: nao havia o que cumprir', () => {
    expect(isPerfectDay([treino], '2026-08-18')).toBe(false);
  });
});

describe('perfectDays', () => {
  it('conta os dias perfeitos do intervalo, incluindo as pontas', () => {
    // 17 e 18 sao perfeitos; 19 e 20 nao
    expect(perfectDays([treino, leitura], '2026-08-17', '2026-08-20')).toBe(2);
  });

  it('intervalo sem dia perfeito da zero', () => {
    expect(perfectDays([treino, leitura], '2026-08-19', '2026-08-20')).toBe(0);
  });
});
