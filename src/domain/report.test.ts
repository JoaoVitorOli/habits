import { describe, expect, it } from 'vitest';

import { buildReport } from './report';

const now = new Date(2026, 7, 27, 10, 0);

const estudos = {
  id: 'h1',
  name: 'Estudos',
  targetPerDay: 1,
  archivedAt: null,
  deletedAt: null,
};

describe('buildReport', () => {
  it('abre com o titulo e a data da exportacao', () => {
    const text = buildReport({ habits: [estudos], completions: [], dayNotes: [] }, now);
    expect(text.split('\n')[0]).toBe('# Hábitos — 27 de agosto de 2026');
  });

  it('escreve a nota ao lado do dia marcado', () => {
    const text = buildReport(
      {
        habits: [estudos],
        completions: [
          { habitId: 'h1', day: '2026-08-27', count: 1, deletedAt: null },
        ],
        dayNotes: [{ habitId: 'h1', day: '2026-08-27', text: 'estudei inglês', deletedAt: null }],
      },
      now,
    );

    expect(text).toContain('- **qui, 27/08** — feito · estudei inglês');
  });

  it('registra o dia que so tem nota', () => {
    const text = buildReport(
      {
        habits: [estudos],
        completions: [],
        dayNotes: [{ habitId: 'h1', day: '2026-08-25', text: 'não fui, chuva', deletedAt: null }],
      },
      now,
    );

    expect(text).toContain('- **ter, 25/08** — não feito · não fui, chuva');
  });

  it('mostra a fracao do dia que nao bateu a meta', () => {
    const text = buildReport(
      {
        habits: [{ ...estudos, targetPerDay: 3 }],
        completions: [{ habitId: 'h1', day: '2026-08-27', count: 2, deletedAt: null }],
        dayNotes: [],
      },
      now,
    );

    expect(text).toContain('- **qui, 27/08** — 2 de 3');
  });

  it('agrupa por mes, do dia mais novo para o mais velho', () => {
    const text = buildReport(
      {
        habits: [estudos],
        completions: [
          { habitId: 'h1', day: '2026-07-30', count: 1, deletedAt: null },
          { habitId: 'h1', day: '2026-08-02', count: 1, deletedAt: null },
          { habitId: 'h1', day: '2026-08-27', count: 1, deletedAt: null },
        ],
        dayNotes: [],
      },
      now,
    );

    const lines = text.split('\n').filter((line) => line.startsWith('### ') || line.startsWith('- '));
    expect(lines).toEqual([
      '### agosto de 2026',
      '- **qui, 27/08** — feito',
      '- **dom, 02/08** — feito',
      '### julho de 2026',
      '- **qui, 30/07** — feito',
    ]);
  });

  it('ignora linha apagada, de marcacao e de nota', () => {
    const text = buildReport(
      {
        habits: [estudos],
        completions: [
          { habitId: 'h1', day: '2026-08-27', count: 1, deletedAt: '2026-08-27T12:00:00.000Z' },
        ],
        dayNotes: [
          {
            habitId: 'h1',
            day: '2026-08-26',
            text: 'apagada',
            deletedAt: '2026-08-26T12:00:00.000Z',
          },
        ],
      },
      now,
    );

    expect(text).not.toContain('27/08');
    expect(text).not.toContain('apagada');
  });

  it('conta os dias feitos e as notas do habito', () => {
    const text = buildReport(
      {
        habits: [estudos],
        completions: [
          { habitId: 'h1', day: '2026-08-27', count: 1, deletedAt: null },
          { habitId: 'h1', day: '2026-08-26', count: 1, deletedAt: null },
        ],
        dayNotes: [{ habitId: 'h1', day: '2026-08-27', text: 'estudei inglês', deletedAt: null }],
      },
      now,
    );

    expect(text).toContain('2 dias feitos · 1 nota');
  });

  it('diz que o habito arquivado esta arquivado', () => {
    const text = buildReport(
      { habits: [{ ...estudos, archivedAt: '2026-08-20T12:00:00.000Z' }], completions: [], dayNotes: [] },
      now,
    );

    expect(text).toContain('## Estudos (arquivado)');
  });

  it('nao lista habito excluido', () => {
    const text = buildReport(
      { habits: [{ ...estudos, deletedAt: '2026-08-20T12:00:00.000Z' }], completions: [], dayNotes: [] },
      now,
    );

    expect(text).not.toContain('Estudos');
  });

  it('avisa quando o habito nao tem nada registrado', () => {
    const text = buildReport({ habits: [estudos], completions: [], dayNotes: [] }, now);
    expect(text).toContain('Nada registrado ainda.');
  });
});
