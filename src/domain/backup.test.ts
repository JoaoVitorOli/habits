import { describe, expect, it } from 'vitest';

import { buildBackup, parseBackup } from './backup';

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

