import { eq, getTableColumns, getTableName, inArray, isNotNull } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { db } from '@/data/db';
import { rescheduleReminders } from '@/data/notifications';
import { completions, dayNotes, habits, syncState } from '@/data/schema';
import { supabase } from '@/data/supabase';
import {
  advance,
  isFirstSync,
  purgeableIds,
  rowsToApply,
  rowsToPush,
  type Cursor,
  type Deletable,
} from '@/domain/sync';
import { refreshWidgets } from '@/widget/refresh';

/** Linha unica: o cursor e deste aparelho, nao da conta. */
const CURSOR_ID = 'local';

/** As tres tabelas que tem dono e exclusao suave. `settings` e o cursor ficam de fora. */
type SyncTable = typeof habits | typeof completions | typeof dayNotes;
const TABLES: SyncTable[] = [habits, completions, dayNotes];

/**
 * O Drizzle ja fala camelCase de um lado e snake_case do outro; o mapeamento sai da propria
 * definicao da tabela, entao o Postgres pode continuar sendo espelho e nao traducao.
 */
type Row = Deletable & Record<string, unknown>;

export const cursorQuery = db.select().from(syncState).where(eq(syncState.id, CURSOR_ID));

export async function readCursor(): Promise<Cursor> {
  const [row] = await cursorQuery;

  return {
    userId: row?.userId ?? null,
    lastPulledAt: row?.lastPulledAt ?? null,
    lastPushedAt: row?.lastPushedAt ?? null,
  };
}

async function writeCursor(cursor: Cursor): Promise<void> {
  await db
    .insert(syncState)
    .values({ id: CURSOR_ID, ...cursor })
    .onConflictDoUpdate({ target: syncState.id, set: cursor });
}

/** Voltar para a frente do app e apertar "sincronizar agora" podem cair juntos. */
let running: Promise<void> | null = null;

/**
 * Um laco por tabela: sobe o delta local, desce o delta remoto, aplica linha inteira e anda
 * com o cursor. Nada aqui decide quem vence — isso e do motor puro em `@/domain/sync`.
 */
export function syncNow(now: Date): Promise<void> {
  running ??= run(now).finally(() => {
    running = null;
  });

  return running;
}

async function run(now: Date): Promise<void> {
  const client = supabase;
  if (client === null) throw new Error('Sync desligado: faltam as chaves no .env.');

  const { data: sessionData } = await client.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (userId === undefined) throw new Error('Entre com o Google para sincronizar.');

  const cursor = await readCursor();

  // primeiro login e merge: tudo que existe aqui vira do usuario e sobe junto
  if (isFirstSync(cursor, userId)) {
    await db.update(habits).set({ userId, updatedAt: now.toISOString() });
  }

  let next = cursor;

  for (const table of TABLES) {
    const { pushed, pulled } = await syncTable(table, client, cursor, userId, now);
    next = advance(next, userId, pushed, pulled);
  }

  await writeCursor(next);
  await rescheduleReminders();
  refreshWidgets();
}

async function syncTable(
  table: SyncTable,
  client: SupabaseClient,
  cursor: Cursor,
  userId: string,
  now: Date,
): Promise<{ pushed: Row[]; pulled: Row[] }> {
  const name = getTableName(table);
  const local = await readAll(table);

  const pushed = rowsToPush(local, cursor, userId);

  if (pushed.length > 0) {
    const { error } = await client.from(name).upsert(pushed.map((row) => toRemote(table, row)));
    if (error) throw new Error(`Não deu para enviar ${name}: ${error.message}`);
  }

  const { data, error } = await client
    .from(name)
    .select('*')
    .gt('updated_at', cursor.lastPulledAt ?? '');

  if (error) throw new Error(`Não deu para baixar ${name}: ${error.message}`);

  const pulled = (data ?? []).map((row) => fromRemote(table, row));
  const applying = rowsToApply(local, pulled);

  if (applying.length > 0) {
    const target = table as typeof habits;

    await db.transaction(async (tx) => {
      for (const row of applying) {
        await tx.delete(target).where(eq(target.id, row.id));
        await tx.insert(target).values(row as never);
      }
    });
  }

  return { pushed, pulled };
}

/**
 * A linha apagada continua existindo porque ela e o recado que leva a exclusao ao outro
 * aparelho. Passados 90 dias o recado ja chegou, e ai ela sai do banco de verdade.
 *
 * Isso e manutencao do aparelho, nao um passo do sync: quem nunca fez login tambem apaga
 * habito, e antes disso a linha morta ficava aqui para sempre — e ainda viajava em todo
 * backup exportado.
 */
export async function purgeDeleted(now: Date): Promise<void> {
  const cursor = await readCursor();

  for (const table of TABLES) {
    const target = table as typeof habits;
    const deleted = (await db.select().from(target).where(isNotNull(target.deletedAt))) as unknown as Row[];

    const ids = purgeableIds(deleted, cursor, now);
    if (ids.length === 0) continue;

    await db.delete(target).where(inArray(target.id, ids));
  }
}

async function readAll(table: SyncTable): Promise<Row[]> {
  return (await db.select().from(table as typeof habits)) as unknown as Row[];
}

function toRemote(table: SyncTable, row: Row): Record<string, unknown> {
  const columns = getTableColumns(table);

  return Object.fromEntries(
    Object.entries(columns).map(([key, column]) => [column.name, row[key] ?? null]),
  );
}

function fromRemote(table: SyncTable, remote: Record<string, unknown>): Row {
  const columns = getTableColumns(table);

  return Object.fromEntries(
    Object.entries(columns).map(([key, column]) => [key, remote[column.name] ?? null]),
  ) as Row;
}

/** Logout nao apaga nada: so tira a conta da frente e esquece por onde o sync andava. */
export async function forgetAccount(): Promise<void> {
  await db.update(habits).set({ userId: null });
  await db.delete(syncState).where(eq(syncState.id, CURSOR_ID));
}

export function useSession(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (supabase === null) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));

    return () => data.subscription.unsubscribe();
  }, []);

  return session;
}

/**
 * Sincronizar e barato e falhar e inofensivo — local e a verdade. Entao roda na abertura e
 * toda vez que o app volta para a frente, sem contar para o usuario que tentou.
 */
export function useAutoSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || supabase === null) return;

    const attempt = () => {
      syncNow(new Date()).catch(() => {});
    };

    attempt();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') attempt();
    });

    return () => subscription.remove();
  }, [enabled]);
}
