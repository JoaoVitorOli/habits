import { describe, expect, it } from 'vitest';

import { purgeableIds } from './purge';

const agora = new Date(2026, 7, 24, 14, 3);

function apagadaHa(dias: number) {
  return {
    id: `h${dias}`,
    deletedAt: new Date(agora.getTime() - dias * 86_400_000).toISOString(),
  };
}

describe('purgeableIds', () => {
  it('purga a linha apagada ha mais de 90 dias', () => {
    expect(purgeableIds([apagadaHa(91)], agora)).toEqual(['h91']);
  });

  it('segura a exclusao recente: ela ainda e o recado para quem importar o backup', () => {
    expect(purgeableIds([apagadaHa(89)], agora)).toEqual([]);
  });

  it('nunca purga linha viva, por mais velha que seja', () => {
    expect(purgeableIds([{ id: 'h1', deletedAt: null }], agora)).toEqual([]);
  });

  it('separa numa lista misturada', () => {
    const ids = purgeableIds([apagadaHa(120), { id: 'viva', deletedAt: null }, apagadaHa(2)], agora);
    expect(ids).toEqual(['h120']);
  });
});
