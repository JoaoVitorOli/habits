import { describe, expect, it } from 'vitest';

import { buildBackup, parseBackup, rowsToApply, type Versioned } from './backup';

const vazio = { habits: [], completions: [], dayNotes: [] };

describe('buildBackup', () => {
  it('carimba a versao e o instante da exportacao', () => {
    const backup = buildBackup(vazio, new Date('2026-08-24T19:00:00.000Z'));
    expect(backup.v).toBe(1);
    expect(backup.exportedAt).toBe('2026-08-24T19:00:00.000Z');
  });
});

describe('parseBackup', () => {
  it('aceita um backup bem formado', () => {
    const text = JSON.stringify(buildBackup(vazio, new Date('2026-08-24T19:00:00.000Z')));
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
  });

  it('recusa texto que nao e JSON', () => {
    expect(parseBackup('isso nao e json')).toEqual({
      ok: false,
      reason: 'O arquivo não é um JSON válido.',
    });
  });

  it('recusa versao que este app nao le', () => {
    const result = parseBackup(JSON.stringify({ v: 99, exportedAt: 'x', habits: [], completions: [], dayNotes: [] }));
    expect(result.ok).toBe(false);
  });

  it('recusa arquivo com linha sem id ou sem data', () => {
    const result = parseBackup(
      JSON.stringify({ v: 1, exportedAt: 'x', habits: [{ name: 'Treino' }], completions: [], dayNotes: [] }),
    );
    expect(result.ok).toBe(false);
  });
});

describe('rowsToApply', () => {
  const local: Versioned[] = [
    { id: 'a', updatedAt: '2026-08-20T10:00:00.000Z' },
    { id: 'b', updatedAt: '2026-08-22T10:00:00.000Z' },
  ];

  it('traz a linha que nao existe aqui', () => {
    const nova = { id: 'c', updatedAt: '2026-08-01T10:00:00.000Z' };
    expect(rowsToApply(local, [nova])).toEqual([nova]);
  });

  it('reimportar o mesmo arquivo nao aplica nada', () => {
    expect(rowsToApply(local, local)).toEqual([]);
  });

  it('aplica a linha do arquivo quando ela e mais recente', () => {
    const maisNova = { id: 'a', updatedAt: '2026-08-23T10:00:00.000Z' };
    expect(rowsToApply(local, [maisNova])).toEqual([maisNova]);
  });

  it('mantem o local quando o local e mais recente', () => {
    const maisVelha = { id: 'b', updatedAt: '2026-08-21T10:00:00.000Z' };
    expect(rowsToApply(local, [maisVelha])).toEqual([]);
  });
});
