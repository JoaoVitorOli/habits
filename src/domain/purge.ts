/**
 * Manutencao do aparelho: a linha apagada nao some do banco na hora.
 *
 * Ela e o recado da exclusao — e assim que apagar um habito aqui apaga tambem no aparelho que
 * importar o backup, em vez de o habito ressuscitar na proxima importacao. Passados 90 dias o
 * recado ja chegou a quem tinha de chegar, e a linha sai de vez.
 */
export type Deletable = { id: string; deletedAt: string | null };

export const PURGE_AFTER_DAYS = 90;

const MS_PER_DAY = 86_400_000;

export function purgeableIds(rows: Deletable[], now: Date): string[] {
  const limit = new Date(now.getTime() - PURGE_AFTER_DAYS * MS_PER_DAY).toISOString();

  return rows.filter((row) => row.deletedAt !== null && row.deletedAt < limit).map((row) => row.id);
}
