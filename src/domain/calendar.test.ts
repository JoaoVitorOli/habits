import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  daysBetween,
  endOfMonth,
  logicalDay,
  monthOf,
  startOfWeek,
  toDay,
  weekdayOf,
} from './calendar';

describe('toDay', () => {
  it('formata a data local, nao a UTC', () => {
    // 23:30 de 24/08/2026 no fuso local ainda e dia 24, mesmo que em UTC ja seja 25
    expect(toDay(new Date(2026, 7, 24, 23, 30))).toBe('2026-08-24');
  });

  it('preenche mes e dia com zero a esquerda', () => {
    expect(toDay(new Date(2026, 0, 5, 12, 0))).toBe('2026-01-05');
  });
});

describe('logicalDay', () => {
  it('marcacao as 00:40 pertence ao dia anterior quando a virada e as 4h', () => {
    expect(logicalDay(new Date(2026, 7, 25, 0, 40), 4)).toBe('2026-08-24');
  });

  it('marcacao as 04:00 em ponto ja pertence ao novo dia', () => {
    expect(logicalDay(new Date(2026, 7, 25, 4, 0), 4)).toBe('2026-08-25');
  });

  it('marcacao as 03:59 ainda pertence ao dia anterior', () => {
    expect(logicalDay(new Date(2026, 7, 25, 3, 59), 4)).toBe('2026-08-24');
  });

  it('com virada as 0h o dia logico e o dia do calendario', () => {
    expect(logicalDay(new Date(2026, 7, 25, 0, 10), 0)).toBe('2026-08-25');
  });

  it('atravessa a virada do mes', () => {
    expect(logicalDay(new Date(2026, 8, 1, 2, 0), 4)).toBe('2026-08-31');
  });
});

describe('addDays', () => {
  it('anda para frente atravessando o fim do mes', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
  });

  it('anda para tras atravessando a virada do ano', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('respeita ano bissexto', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

describe('weekdayOf', () => {
  it('domingo e 0', () => {
    // 23/08/2026 e um domingo
    expect(weekdayOf('2026-08-23')).toBe(0);
  });

  it('sabado e 6', () => {
    expect(weekdayOf('2026-08-29')).toBe(6);
  });
});

describe('daysBetween', () => {
  it('conta a distancia em dias entre dois dias logicos', () => {
    expect(daysBetween('2026-08-24', '2026-09-02')).toBe(9);
  });

  it('e negativo quando o fim vem antes do inicio', () => {
    expect(daysBetween('2026-09-02', '2026-08-24')).toBe(-9);
  });
});

describe('startOfWeek', () => {
  it('com semana comecando no domingo, a segunda cai na semana do dia 23', () => {
    // 23/08/2026 e domingo, 24/08 e segunda
    expect(startOfWeek('2026-08-24', 0)).toBe('2026-08-23');
  });

  it('o proprio domingo e o inicio da sua semana', () => {
    expect(startOfWeek('2026-08-23', 0)).toBe('2026-08-23');
  });

  it('com semana comecando na segunda, o domingo pertence a semana anterior', () => {
    expect(startOfWeek('2026-08-23', 1)).toBe('2026-08-17');
  });
});

describe('mes', () => {
  it('o mes de um dia sao os sete primeiros caracteres', () => {
    expect(monthOf('2026-08-24')).toBe('2026-08');
  });

  it('o ultimo dia de agosto e 31 e o de fevereiro bissexto e 29', () => {
    expect(endOfMonth('2026-08')).toBe('2026-08-31');
    expect(endOfMonth('2028-02')).toBe('2028-02-29');
  });

  it('andar de mes atravessa a virada do ano', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('andar de mes nao escorrega quando o mes de destino e mais curto', () => {
    expect(addMonths('2026-01', 1)).toBe('2026-02');
  });
});
