import { describe, expect, it } from 'vitest';

import { isScheduled, toggleWeekday, weekdayBit, weekdaysOf } from './schedule';

const segQuaSex = 2 + 8 + 32;

describe('isScheduled no modo daysOfWeek', () => {
  it('agenda o dia cujo bit esta ligado', () => {
    // 24/08/2026 e uma segunda
    expect(isScheduled({ kind: 'daysOfWeek', days: segQuaSex }, '2026-08-24')).toBe(true);
  });

  it('nao agenda o dia cujo bit esta desligado', () => {
    // 25/08/2026 e uma terca
    expect(isScheduled({ kind: 'daysOfWeek', days: segQuaSex }, '2026-08-25')).toBe(false);
  });

  it('reconhece domingo, que e o bit 1', () => {
    expect(isScheduled({ kind: 'daysOfWeek', days: 1 }, '2026-08-23')).toBe(true);
  });

  it('reconhece sabado, que e o bit 64', () => {
    expect(isScheduled({ kind: 'daysOfWeek', days: 64 }, '2026-08-29')).toBe(true);
  });
});

describe('isScheduled no modo timesPerWeek', () => {
  it('todo dia e elegivel, porque o compromisso e semanal', () => {
    expect(isScheduled({ kind: 'timesPerWeek', times: 3 }, '2026-08-25')).toBe(true);
    expect(isScheduled({ kind: 'timesPerWeek', times: 3 }, '2026-08-30')).toBe(true);
  });
});

describe('weekdayBit', () => {
  it('domingo vale 1 e sabado vale 64', () => {
    expect(weekdayBit(0)).toBe(1);
    expect(weekdayBit(6)).toBe(64);
  });
});

describe('weekdaysOf', () => {
  it('desmonta a mascara na lista de dias, de domingo a sabado', () => {
    expect(weekdaysOf(segQuaSex)).toEqual([1, 3, 5]);
  });

  it('a mascara cheia sao os sete dias', () => {
    expect(weekdaysOf(127)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('mascara vazia nao tem dia', () => {
    expect(weekdaysOf(0)).toEqual([]);
  });
});

describe('toggleWeekday', () => {
  it('liga o dia que estava desligado', () => {
    expect(toggleWeekday(segQuaSex, 2)).toBe(segQuaSex + 4);
  });

  it('desliga o dia que estava ligado', () => {
    expect(toggleWeekday(segQuaSex, 1)).toBe(8 + 32);
  });
});
