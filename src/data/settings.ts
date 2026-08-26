import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { db } from '@/data/db';
import { settings } from '@/data/schema';
import { preferencesOf, type Preferences } from '@/domain/preferences';
import { refreshWidgets } from '@/widget/refresh';

/** Linha unica: a preferencia e deste aparelho, nao da conta. Por isso fica fora do sync. */
const LOCAL = 'local';

export const preferencesQuery = db.select().from(settings).where(eq(settings.id, LOCAL));

/** Query viva: mudar a virada do dia redesenha a home sem ninguem avisar ninguem. */
export function usePreferences(): Preferences {
  const { data } = useLiveQuery(preferencesQuery);
  return preferencesOf(data[0]);
}

export async function readPreferences(): Promise<Preferences> {
  const [row] = await preferencesQuery;
  return preferencesOf(row);
}

/** A linha pode nao existir ainda: gravar um campo so nao pode inventar os outros. */
export async function savePreferences(patch: Partial<Preferences>, now: Date): Promise<void> {
  const next = { ...(await readPreferences()), ...patch, updatedAt: now.toISOString() };

  await db.insert(settings).values({ id: LOCAL, ...next }).onConflictDoUpdate({ target: settings.id, set: next });

  // a virada e o inicio da semana viajam dentro do snapshot: o widget precisa ser reescrito
  refreshWidgets();
}
