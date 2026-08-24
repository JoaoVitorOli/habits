/**
 * A paleta e fechada e o banco guarda a chave, nunca o hex. As chaves vivem aqui porque
 * sao dado do habito; o hex de cada uma vive em src/ui/theme.ts, que e desenho.
 */
export const paletteKeys = [
  'violeta',
  'indigo',
  'azul',
  'ciano',
  'verde',
  'lima',
  'ambar',
  'laranja',
  'vermelho',
  'rosa',
] as const;

export type PaletteKey = (typeof paletteKeys)[number];

export const defaultPaletteKey: PaletteKey = 'violeta';

/** Linha vinda do banco (ou de um import JSON) pode trazer chave desconhecida. */
export function paletteKeyOf(value: string): PaletteKey {
  return (paletteKeys as readonly string[]).includes(value) ? (value as PaletteKey) : defaultPaletteKey;
}
