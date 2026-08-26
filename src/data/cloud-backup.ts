import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { applyBackup, readEverything, type ImportSummary } from '@/data/backup';
import { supabase } from '@/data/supabase';
import { buildBackup, checkBackup, isBackupDue, rowsToRestore } from '@/domain/backup';

/**
 * Copia de seguranca da conta: uma linha por usuario, trocada inteira a cada backup.
 *
 * Nao substitui o sync e nem se parece com ele. O sync espelha o estado de agora, e por isso
 * carrega o erro junto: excluir um habito por engano viaja para os outros aparelhos em segundos.
 * Este e o estado de um dia especifico, parado, para quando o "agora" estiver errado.
 */
const TABLE = 'backups';

type Account = { api: SupabaseClient; userId: string };

async function account(): Promise<Account> {
  const api = supabase;
  if (api === null) throw new Error('Sync desligado: faltam as chaves no .env.');

  const { data } = await api.auth.getSession();
  const userId = data.session?.user.id;
  if (userId === undefined) throw new Error('Entre com o Google para guardar o backup.');

  return { api, userId };
}

/** `null` quando ainda nao ha backup nenhum guardado nesta conta. */
export async function readCloudBackupAt(): Promise<string | null> {
  const { api, userId } = await account();

  const { data, error } = await api
    .from(TABLE)
    .select('updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Não deu para ler o backup da conta: ${error.message}`);

  return (data?.updated_at as string | undefined) ?? null;
}

/** Troca o backup inteiro pelo estado de agora. Um por conta: o antigo nao interessa mais. */
export async function saveCloudBackup(now: Date): Promise<string> {
  const { api, userId } = await account();
  const backup = buildBackup(await readEverything(), now);

  const { error } = await api
    .from(TABLE)
    .upsert({ user_id: userId, payload: backup, updated_at: backup.exportedAt });

  if (error) throw new Error(`Não deu para guardar o backup: ${error.message}`);

  return backup.exportedAt;
}

/** `null` quando nao ha backup guardado. */
export async function restoreCloudBackup(now: Date): Promise<ImportSummary | null> {
  const { api, userId } = await account();

  const { data, error } = await api.from(TABLE).select('payload').eq('user_id', userId).maybeSingle();

  if (error) throw new Error(`Não deu para ler o backup da conta: ${error.message}`);
  if (!data) return null;

  const parsed = checkBackup(data.payload);
  if (!parsed.ok) throw new Error(parsed.reason);

  return applyBackup(parsed.backup, rowsToRestore, now);
}

/**
 * A copia semanal nao tem agendador: toda abertura pergunta a idade do que esta guardado, e
 * so grava se ja passou a semana. Falhar e inofensivo — local continua sendo a verdade.
 */
export function useWeeklyBackup(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || supabase === null) return;

    const now = new Date();

    readCloudBackupAt()
      .then((at) => (isBackupDue(at, now) ? saveCloudBackup(now) : null))
      .catch(() => {});
  }, [enabled]);
}

/** A tela nao espera a rede para desenhar: a idade chega depois, se chegar. */
export function useCloudBackupAt(): { at: string | null; loading: boolean; reload: () => void } {
  const [round, setRound] = useState(0);
  const [state, setState] = useState<{ at: string | null; loading: boolean }>({ at: null, loading: true });

  useEffect(() => {
    let alive = true;
    const land = (at: string | null) => {
      if (alive) setState({ at, loading: false });
    };

    readCloudBackupAt()
      .then(land)
      .catch(() => land(null));

    return () => {
      alive = false;
    };
  }, [round]);

  return { ...state, reload: () => setRound((current) => current + 1) };
}
