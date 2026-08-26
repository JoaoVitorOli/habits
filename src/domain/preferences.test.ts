import { describe, expect, it } from 'vitest';

import { DEFAULT_PREFERENCES, hourLabel, preferencesOf, wrapHour } from './preferences';

describe('preferencesOf', () => {
  it('cai no padrao quando ainda nao ha linha', () => {
    expect(preferencesOf(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('mantem o que reconhece', () => {
    expect(preferencesOf({ dayStartHour: 0, weekStartsOn: 1, homeView: 'compact' })).toEqual({
      dayStartHour: 0,
      weekStartsOn: 1,
      homeView: 'compact',
    });
  });

  it('troca por padrao cada campo fora do combinado, sem descartar os outros', () => {
    expect(preferencesOf({ dayStartHour: 24, weekStartsOn: 3, homeView: 'lista' })).toEqual(
      DEFAULT_PREFERENCES,
    );
    expect(preferencesOf({ dayStartHour: 4.5, weekStartsOn: 1 })).toEqual({
      ...DEFAULT_PREFERENCES,
      weekStartsOn: 1,
    });
  });
});

describe('wrapHour', () => {
  it('da a volta nas duas pontas', () => {
    expect(wrapHour(24)).toBe(0);
    expect(wrapHour(-1)).toBe(23);
    expect(wrapHour(4)).toBe(4);
  });
});

describe('hourLabel', () => {
  it('escreve a hora cheia com dois digitos', () => {
    expect(hourLabel(4)).toBe('04:00');
    expect(hourLabel(23)).toBe('23:00');
  });
});
