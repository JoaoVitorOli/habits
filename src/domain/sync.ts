/**
 * Motor do sync: puro. Recebe as linhas locais, as linhas remotas e o relogio; devolve o que
 * enviar, o que aplicar e onde o cursor para. Quem fala com a rede e `src/data/sync.ts`.
 *
 * A regra de merge e uma so em todo o app — maior `updated_at` vence, linha inteira, sem merge
 * por campo — e por isso a importacao de backup consome ela daqui em vez de repetir.
 */

export type Versioned = { id: string; updatedAt: string };
export type Deletable = Versioned & { deletedAt: string | null };

/** Local, nunca sincroniza: e o que este aparelho ja viu deste usuario. */
export type Cursor = {
  userId: string | null;
  lastPulledAt: string | null;
  lastPushedAt: string | null;
};

/** Linha apagada some da UI na hora, mas so sai do banco depois disso — ela e o recado. */
export const PURGE_AFTER_DAYS = 90;

/**
 * Primeiro login e merge, nao escolha entre local e nuvem: o cursor ainda nao conhece esse
 * usuario, entao tudo que existe aqui sobe, inclusive o que foi criado antes de haver conta.
 */
export function isFirstSync(cursor: Cursor, userId: string): boolean {
  return cursor.userId !== userId;
}

export function rowsToPush<T extends Versioned>(local: T[], cursor: Cursor, userId: string): T[] {
  const since = cursor.lastPushedAt;
  if (since === null || isFirstSync(cursor, userId)) return local;

  return local.filter((row) => row.updatedAt > since);
}

/** Entra a linha que nao existe aqui ou que e mais recente que a minha. Inteira. */
export function rowsToApply<T extends Versioned>(local: T[], incoming: T[]): T[] {
  const mine = new Map(local.map((row) => [row.id, row.updatedAt]));

  return incoming.filter((row) => {
    const current = mine.get(row.id);
    return current === undefined || row.updatedAt > current;
  });
}

/**
 * O cursor anda pelo maior `updated_at` que passou por ele, e nao pelo relogio deste aparelho:
 * assim um celular adiantado nao faz o proximo delta pular linhas que ele nunca viu.
 */
export function advance(
  cursor: Cursor,
  userId: string,
  pushed: Versioned[],
  pulled: Versioned[],
): Cursor {
  return {
    userId,
    lastPushedAt: latestOf(cursor.lastPushedAt, pushed),
    lastPulledAt: latestOf(cursor.lastPulledAt, pulled),
  };
}

/**
 * A purga e do aparelho e nao do sync: sem conta nenhuma, a linha apagada nao e recado para
 * ninguem e vence sozinha. Com conta, ela so pode sair depois de ter subido — senao o outro
 * aparelho nunca fica sabendo da exclusao e o habito ressuscita no proximo pull.
 */
export function purgeableIds(rows: Deletable[], cursor: Cursor, now: Date): string[] {
  const limit = new Date(now.getTime() - PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const pushed = cursor.lastPushedAt;

  return rows
    .filter((row) => row.deletedAt !== null && row.deletedAt < limit)
    .filter((row) => cursor.userId === null || (pushed !== null && row.updatedAt <= pushed))
    .map((row) => row.id);
}

export function syncAgeLabel(lastPulledAt: string | null, now: Date): string {
  const age = ageLabel(lastPulledAt, now);
  return age === null ? 'Nunca sincronizado' : `Sincronizado ${age}`;
}

/** `null` quando nunca aconteceu. Duas telas contam idade; a conta e uma so. */
export function ageLabel(at: string | null, now: Date): string | null {
  if (at === null) return null;

  const minutes = Math.floor((now.getTime() - new Date(at).getTime()) / 60_000);

  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function latestOf(current: string | null, rows: Versioned[]): string | null {
  return rows.reduce<string | null>(
    (latest, row) => (latest === null || row.updatedAt > latest ? row.updatedAt : latest),
    current,
  );
}
