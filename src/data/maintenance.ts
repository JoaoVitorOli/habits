import { inArray, isNotNull } from 'drizzle-orm';

import { db } from '@/data/db';
import { completions, dayNotes, habits } from '@/data/schema';
import { purgeableIds, type Deletable } from '@/domain/purge';

/**
 * Varre as linhas apagadas que ja passaram do prazo. Roda na abertura do app, sem ninguem
 * esperar por ela: e faxina, nao operacao.
 */
export async function purgeDeleted(now: Date): Promise<void> {
  for (const table of [habits, completions, dayNotes]) {
    // as tres tabelas tem `id` e `deleted_at`, mas a uniao delas nao e uma tabela para o Drizzle
    const target = table as typeof habits;
    const deleted = (await db
      .select()
      .from(target)
      .where(isNotNull(target.deletedAt))) as unknown as Deletable[];

    const ids = purgeableIds(deleted, now);
    if (ids.length === 0) continue;

    await db.delete(target).where(inArray(target.id, ids));
  }
}
