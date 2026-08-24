import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { cursorQuery, forgetAccount, syncNow, useSession } from '@/data/sync';
import { signInWithGoogle, signOutFromGoogle, syncConfigured } from '@/data/supabase';
import { syncAgeLabel } from '@/domain/sync';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { space } from '@/ui/theme';

/**
 * A conta e opcional e o app nunca espera por ela: este cartao e o unico lugar onde a rede
 * aparece, e mesmo aqui o pior caso e uma linha de texto dizendo que nao deu.
 */
export function SyncCard() {
  const session = useSession();
  const { data: cursor } = useLiveQuery(cursorQuery);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const agora = useMinuteClock();

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setFailure(null);

    try {
      await task();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Não deu para sincronizar.');
    } finally {
      setBusy(false);
    }
  }

  if (!syncConfigured) {
    return (
      <View style={styles.block}>
        <Text variant="label" tone="inkFaint">
          Conta
        </Text>
        <Text variant="caption" tone="inkFaint">
          Sync desligado: faltam EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY e
          EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no .env. O app funciona inteiro sem eles.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Text variant="label" tone="inkFaint">
        Conta
      </Text>

      {session === null ? (
        <>
          <Text variant="caption" tone="inkFaint">
            Entrar guarda seus hábitos na nuvem e junta o que já existe aqui — nada é
            substituído.
          </Text>
          <Button
            label="Entrar com Google"
            variant="ghost"
            loading={busy}
            onPress={() =>
              run(async () => {
                const entrou = await signInWithGoogle();
                if (entrou !== null) await syncNow(new Date());
              })
            }
          />
        </>
      ) : (
        <>
          <Text variant="body" numberOfLines={1}>
            {session.user.email ?? 'Conta Google'}
          </Text>
          <Text variant="caption" tone="inkFaint">
            {syncAgeLabel(cursor[0]?.lastPulledAt ?? null, agora)}
          </Text>
          <View style={styles.actions}>
            <Button
              label="Sincronizar agora"
              variant="ghost"
              loading={busy}
              onPress={() => run(() => syncNow(new Date()))}
              style={styles.action}
            />
            <Button
              label="Sair"
              variant="ghost"
              disabled={busy}
              onPress={() =>
                run(async () => {
                  await signOutFromGoogle();
                  await forgetAccount();
                })
              }
              style={styles.action}
            />
          </View>
        </>
      )}

      {failure === null ? null : (
        <Text variant="caption" tone="perigo">
          {failure}
        </Text>
      )}
    </View>
  );
}

/** "ha 3 min" tem que virar "ha 4 min" sozinho, sem depender de outra renderizacao. */
function useMinuteClock(): Date {
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return agora;
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
});
