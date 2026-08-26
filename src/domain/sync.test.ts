import { describe, expect, it } from 'vitest';

import {
  advance,
  purgeableIds,
  rowsToApply,
  rowsToPush,
  syncAgeLabel,
  type Cursor,
  type Versioned,
} from './sync';

const conhecido: Cursor = {
  userId: 'joao',
  lastPulledAt: '2026-08-22T10:00:00.000Z',
  lastPushedAt: '2026-08-22T10:00:00.000Z',
};

const local: Versioned[] = [
  { id: 'a', updatedAt: '2026-08-20T10:00:00.000Z' },
  { id: 'b', updatedAt: '2026-08-23T10:00:00.000Z' },
];

describe('rowsToPush', () => {
  it('manda so o que mudou depois do ultimo envio', () => {
    expect(rowsToPush(local, conhecido, 'joao')).toEqual([local[1]]);
  });

  it('no primeiro login manda tudo, inclusive o que e mais velho que o cursor', () => {
    expect(rowsToPush(local, conhecido, 'outro')).toEqual(local);
  });

  it('manda tudo enquanto nunca houve envio', () => {
    expect(rowsToPush(local, { ...conhecido, lastPushedAt: null }, 'joao')).toEqual(local);
  });

  it('nao remanda a linha que tem a data exata do ultimo envio', () => {
    const naHora = [{ id: 'c', updatedAt: conhecido.lastPushedAt! }];
    expect(rowsToPush(naHora, conhecido, 'joao')).toEqual([]);
  });
});

describe('rowsToApply', () => {
  it('traz a linha que nao existe aqui', () => {
    const nova = { id: 'c', updatedAt: '2026-08-01T10:00:00.000Z' };
    expect(rowsToApply(local, [nova])).toEqual([nova]);
  });

  it('no conflito, a linha mais recente vence', () => {
    const remota = { id: 'a', updatedAt: '2026-08-24T10:00:00.000Z' };
    expect(rowsToApply(local, [remota])).toEqual([remota]);
  });

  it('no conflito, a local mais recente fica', () => {
    expect(rowsToApply(local, [{ id: 'b', updatedAt: '2026-08-21T10:00:00.000Z' }])).toEqual([]);
  });

  it('a exclusao viaja como linha: deletedAt mais novo entra', () => {
    const apagada = { id: 'b', updatedAt: '2026-08-24T10:00:00.000Z', deletedAt: '2026-08-24T10:00:00.000Z' };
    expect(rowsToApply(local, [apagada])).toEqual([apagada]);
  });

  it('sincronizar duas vezes seguidas nao aplica nada na segunda', () => {
    expect(rowsToApply(local, local)).toEqual([]);
  });
});

describe('advance', () => {
  it('para no maior updatedAt que passou, nao no relogio do aparelho', () => {
    const cursor = advance(conhecido, 'joao', [local[1]], [{ id: 'c', updatedAt: '2026-08-25T08:00:00.000Z' }]);

    expect(cursor).toEqual({
      userId: 'joao',
      lastPushedAt: '2026-08-23T10:00:00.000Z',
      lastPulledAt: '2026-08-25T08:00:00.000Z',
    });
  });

  it('sem trafego, o cursor fica onde estava e so adota o usuario', () => {
    expect(advance({ ...conhecido, userId: null }, 'joao', [], [])).toEqual(conhecido);
  });

  it('nao anda para tras quando a linha e mais velha que o cursor', () => {
    const cursor = advance(conhecido, 'joao', [], [{ id: 'c', updatedAt: '2026-01-01T00:00:00.000Z' }]);
    expect(cursor.lastPulledAt).toBe(conhecido.lastPulledAt);
  });
});

describe('purgeableIds', () => {
  const agora = new Date('2026-08-24T12:00:00.000Z');
  const semConta: Cursor = { userId: null, lastPulledAt: null, lastPushedAt: null };
  const velha = { updatedAt: '2026-01-01T00:00:00.000Z', deletedAt: '2026-01-01T00:00:00.000Z' };

  it('purga a linha apagada ha mais de 90 dias', () => {
    expect(purgeableIds([{ id: 'a', ...velha }], semConta, agora)).toEqual(['a']);
  });

  it('segura a exclusao recente: ela ainda e o recado para o outro aparelho', () => {
    const rows = [{ id: 'a', updatedAt: 'x', deletedAt: '2026-08-20T00:00:00.000Z' }];
    expect(purgeableIds(rows, semConta, agora)).toEqual([]);
  });

  it('nunca purga linha viva', () => {
    expect(purgeableIds([{ id: 'a', updatedAt: 'x', deletedAt: null }], semConta, agora)).toEqual([]);
  });

  it('com conta, segura o recado que ainda nao subiu: senao o habito ressuscita no pull', () => {
    expect(purgeableIds([{ id: 'a', ...velha }], { ...conhecido, lastPushedAt: null }, agora)).toEqual([]);
    expect(
      purgeableIds([{ id: 'a', ...velha, updatedAt: '2026-08-23T10:00:00.000Z' }], conhecido, agora),
    ).toEqual([]);
  });

  it('com conta, solta o recado que ja subiu', () => {
    expect(purgeableIds([{ id: 'a', ...velha }], conhecido, agora)).toEqual(['a']);
  });
});

describe('syncAgeLabel', () => {
  const agora = new Date('2026-08-24T12:00:00.000Z');

  it('diz quando nunca houve sync', () => {
    expect(syncAgeLabel(null, agora)).toBe('Nunca sincronizado');
  });

  it('arredonda o que acabou de acontecer para agora', () => {
    expect(syncAgeLabel('2026-08-24T11:59:30.000Z', agora)).toBe('Sincronizado agora');
  });

  it('conta em minutos, horas e dias', () => {
    expect(syncAgeLabel('2026-08-24T11:37:00.000Z', agora)).toBe('Sincronizado há 23 min');
    expect(syncAgeLabel('2026-08-24T09:00:00.000Z', agora)).toBe('Sincronizado há 3 h');
    expect(syncAgeLabel('2026-08-23T09:00:00.000Z', agora)).toBe('Sincronizado há 1 dia');
    expect(syncAgeLabel('2026-08-20T09:00:00.000Z', agora)).toBe('Sincronizado há 4 dias');
  });
});
