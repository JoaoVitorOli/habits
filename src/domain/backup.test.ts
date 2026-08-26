import { describe, expect, it } from 'vitest';

import { buildBackup, parseBackup, rowsToApply, rowsToImport, type Versioned } from './backup';

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


describe('rowsToImport', () => {
  const local = [{ id: 'a', updatedAt: '2026-08-20T00:00:00.000Z' }];
  const agora = new Date('2026-08-26T12:00:00.000Z');

  it('carimba agora na linha que entra, para ela ainda subir no proximo sync', () => {
    const incoming = [{ id: 'b', updatedAt: '2026-01-01T00:00:00.000Z' }];

    expect(rowsToImport(local, incoming, agora)).toEqual([
      { id: 'b', updatedAt: '2026-08-26T12:00:00.000Z' },
    ]);
  });

  it('nao encosta na linha local mais nova que a do arquivo', () => {
    const incoming = [{ id: 'a', updatedAt: '2026-08-19T00:00:00.000Z' }];

    expect(rowsToImport(local, incoming, agora)).toEqual([]);
  });

  it('e idempotente: reimportar o mesmo arquivo nao aplica nada', () => {
    const incoming = [{ id: 'c', updatedAt: '2026-08-25T00:00:00.000Z' }];
    const primeira = rowsToImport(local, incoming, agora);

    expect(primeira).toHaveLength(1);
    expect(rowsToImport([...local, ...primeira], incoming, agora)).toEqual([]);
  });
});

const local: Versioned[] = [
  { id: 'a', updatedAt: '2026-08-20T10:00:00.000Z' },
  { id: 'b', updatedAt: '2026-08-23T10:00:00.000Z' },
];

describe('rowsToApply', () => {
  it('traz a linha que nao existe aqui', () => {
    const nova = { id: 'c', updatedAt: '2026-08-01T10:00:00.000Z' };
    expect(rowsToApply(local, [nova])).toEqual([nova]);
  });

  it('no conflito, a linha mais recente vence', () => {
    const doArquivo = { id: 'a', updatedAt: '2026-08-24T10:00:00.000Z' };
    expect(rowsToApply(local, [doArquivo])).toEqual([doArquivo]);
  });

  it('no conflito, a local mais recente fica', () => {
    expect(rowsToApply(local, [{ id: 'b', updatedAt: '2026-08-21T10:00:00.000Z' }])).toEqual([]);
  });

  it('a exclusao viaja como linha: deletedAt mais novo entra', () => {
    const apagada = { id: 'b', updatedAt: '2026-08-24T10:00:00.000Z', deletedAt: '2026-08-24T10:00:00.000Z' };
    expect(rowsToApply(local, [apagada])).toEqual([apagada]);
  });

  it('importar o mesmo arquivo duas vezes nao aplica nada na segunda', () => {
    expect(rowsToApply(local, local)).toEqual([]);
  });
});
