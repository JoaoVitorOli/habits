import { describe, expect, it } from 'vitest';

import { DEFAULT_PREFERENCES } from './preferences';
import {
  SNAPSHOT_VERSION,
  buildSnapshot,
  habitOf,
  habitsOf,
  isDone,
  parseSnapshot,
  toggleDay,
  toggleHabit,
  type SnapshotHabit,
} from './widget-snapshot';

const treino = {
  id: 'h1',
  name: 'Treino',
  description: 'Uma hora de academia',
  icon: 'lucide:dumbbell',
  color: 'vermelho',
  targetPerDay: 1,
  schedule: { kind: 'daysOfWeek', days: 127 } as const,
};

const gerado = new Date(2026, 7, 24, 14, 3);

describe('buildSnapshot', () => {
  it('guarda so os dias marcados, com a contagem de cada um', () => {
    const snapshot = buildSnapshot({
      habits: [treino],
      completions: [
        { habitId: 'h1', day: '2026-08-24', count: 1 },
        { habitId: 'h1', day: '2026-08-23', count: 0 },
        { habitId: 'h1', day: '2026-08-22', count: 2 },
      ],
      today: '2026-08-24',
      preferences: DEFAULT_PREFERENCES,
      generatedAt: gerado,
    });

    expect(snapshot.v).toBe(SNAPSHOT_VERSION);
    expect(snapshot.habits[0].days).toEqual({ '2026-08-24': 1, '2026-08-22': 2 });
  });

  it('descarta o que caiu fora da janela de 120 dias', () => {
    // 27/04/2026 e o dia 120 contando de hoje para tras; 26/04 e o 121
    const snapshot = buildSnapshot({
      habits: [treino],
      completions: [
        { habitId: 'h1', day: '2026-04-27', count: 1 },
        { habitId: 'h1', day: '2026-04-26', count: 1 },
      ],
      today: '2026-08-24',
      preferences: DEFAULT_PREFERENCES,
      generatedAt: gerado,
    });

    expect(snapshot.habits[0].days).toEqual({ '2026-04-27': 1 });
  });

  it('calcula a sequencia sobre todo o historico, nao so sobre a janela', () => {
    const completions = [];
    for (let dia = 1; dia <= 24; dia++) {
      completions.push({ habitId: 'h1', day: `2026-08-${String(dia).padStart(2, '0')}`, count: 1 });
    }

    const snapshot = buildSnapshot({
      habits: [treino],
      completions,
      today: '2026-08-24',
      preferences: DEFAULT_PREFERENCES,
      generatedAt: gerado,
    });

    expect(snapshot.habits[0].currentStreak).toBe(24);
    expect(snapshot.habits[0].streakUnit).toBe('dias');
  });

  it('dia so conta para a sequencia quando bate a meta do proprio habito', () => {
    const agua = { ...treino, id: 'h2', name: 'Agua', targetPerDay: 3 };

    const snapshot = buildSnapshot({
      habits: [agua],
      completions: [
        { habitId: 'h2', day: '2026-08-23', count: 3 },
        { habitId: 'h2', day: '2026-08-22', count: 2 },
        { habitId: 'h2', day: '2026-08-21', count: 3 },
      ],
      today: '2026-08-24',
      preferences: DEFAULT_PREFERENCES,
      generatedAt: gerado,
    });

    expect(snapshot.habits[0].currentStreak).toBe(1);
  });
});

const agua: SnapshotHabit = {
  id: 'h2',
  name: 'Agua',
  description: null,
  icon: 'emoji:💧',
  color: 'azul',
  targetPerDay: 3,
  currentStreak: 4,
  streakUnit: 'dias',
  days: { '2026-08-24': 2 },
};

describe('buildSnapshot, por semana', () => {
  it('a sequencia de um habito de N por semana conta semanas', () => {
    const snapshot = buildSnapshot({
      habits: [{ ...treino, schedule: { kind: 'timesPerWeek', times: 2 } }],
      completions: [
        { habitId: 'h1', day: '2026-08-23', count: 1 },
        { habitId: 'h1', day: '2026-08-24', count: 1 },
        { habitId: 'h1', day: '2026-08-18', count: 1 },
        { habitId: 'h1', day: '2026-08-19', count: 1 },
      ],
      today: '2026-08-24',
      preferences: DEFAULT_PREFERENCES,
      generatedAt: gerado,
    });

    expect(snapshot.habits[0].streakUnit).toBe('semanas');
    expect(snapshot.habits[0].currentStreak).toBe(2);
  });
});

describe('isDone', () => {
  it('so esta feito quando a contagem alcanca a meta do dia', () => {
    expect(isDone(agua, '2026-08-24')).toBe(false);
    expect(isDone({ ...agua, days: { '2026-08-24': 3 } }, '2026-08-24')).toBe(true);
    expect(isDone(agua, '2026-08-23')).toBe(false);
  });
});

describe('toggleDay', () => {
  it('soma uma marcacao enquanto a meta nao chegou', () => {
    expect(toggleDay(agua, '2026-08-24').days['2026-08-24']).toBe(3);
  });

  it('zera quando a meta ja estava batida', () => {
    const cheio = { ...agua, days: { '2026-08-24': 3 } };
    expect(toggleDay(cheio, '2026-08-24').days['2026-08-24']).toBe(0);
  });

  it('nao altera o habito recebido', () => {
    toggleDay(agua, '2026-08-24');
    expect(agua.days['2026-08-24']).toBe(2);
  });
});

describe('parseSnapshot', () => {
  it('devolve nulo sem snapshot, com lixo ou com versao de outro app', () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('{')).toBeNull();
    expect(parseSnapshot(JSON.stringify({ v: 99, generatedAt: '', habits: [] }))).toBeNull();
  });

  it('devolve o snapshot quando a versao e a esperada', () => {
    const snapshot = { v: SNAPSHOT_VERSION, generatedAt: gerado.toISOString(), dayStartHour: 4, weekStartsOn: 0, habits: [agua] };
    expect(parseSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
  });
});

describe('habitsOf', () => {
  const snapshot = {
    v: SNAPSHOT_VERSION,
    generatedAt: gerado.toISOString(),
    dayStartHour: 4,
    weekStartsOn: 0,
    habits: [agua, { ...agua, id: 'h3', name: 'Ler' }, { ...agua, id: 'h4', name: 'Correr' }],
  };

  it('mantem a ordem do snapshot, que e a ordem do app', () => {
    expect(habitsOf(snapshot, 3).map((habit) => habit.name)).toEqual(['Agua', 'Ler', 'Correr']);
  });

  it('corta no numero de linhas que couberam', () => {
    expect(habitsOf(snapshot, 2).map((habit) => habit.id)).toEqual(['h2', 'h3']);
  });

  it('devolve lista vazia sem snapshot ou sem linha nenhuma', () => {
    expect(habitsOf(null, 3)).toEqual([]);
    expect(habitsOf(snapshot, 0)).toEqual([]);
    expect(habitsOf(snapshot, -1)).toEqual([]);
  });

  it('nao inventa linha quando ha menos habitos do que cabe', () => {
    expect(habitsOf(snapshot, 9)).toHaveLength(3);
  });
});

describe('toggleHabit', () => {
  const snapshot = {
    v: SNAPSHOT_VERSION,
    generatedAt: gerado.toISOString(),
    dayStartHour: 4,
    weekStartsOn: 0,
    habits: [agua, { ...agua, id: 'h3', days: {} }],
  };

  it('mexe so no habito tocado', () => {
    const depois = toggleHabit(snapshot, 'h2', '2026-08-24');

    expect(depois?.habits[0].days['2026-08-24']).toBe(3);
    expect(depois?.habits[1].days['2026-08-24']).toBeUndefined();
  });

  it('nao altera o snapshot recebido', () => {
    toggleHabit(snapshot, 'h2', '2026-08-24');
    expect(snapshot.habits[0].days['2026-08-24']).toBe(2);
  });

  it('devolve nulo quando nao havia snapshot', () => {
    expect(toggleHabit(null, 'h2', '2026-08-24')).toBeNull();
  });
});

describe('habitOf', () => {
  const snapshot = { v: SNAPSHOT_VERSION, generatedAt: gerado.toISOString(), dayStartHour: 4, weekStartsOn: 0, habits: [agua] };

  it('acha o habito do widget e devolve nulo quando ele nao existe mais', () => {
    expect(habitOf(snapshot, 'h2')?.name).toBe('Agua');
    expect(habitOf(snapshot, 'sumiu')).toBeNull();
    expect(habitOf(null, 'h2')).toBeNull();
  });
});
