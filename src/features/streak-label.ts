/** pt-BR concorda em numero e genero. Um lugar so, porque tres telas dizem a mesma coisa. */
export type StreakUnit = 'dias' | 'semanas';

export function unitFor(value: number, unit: StreakUnit): string {
  if (value !== 1) return unit;
  return unit === 'dias' ? 'dia' : 'semana';
}

export function streakLabel(value: number, unit: StreakUnit): string {
  if (unit === 'dias') return value === 1 ? '1 dia seguido' : `${value} dias seguidos`;
  return value === 1 ? '1 semana seguida' : `${value} semanas seguidas`;
}
