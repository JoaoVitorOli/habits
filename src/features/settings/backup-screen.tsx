import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { exportBackup, importBackup } from '@/data/backup';
import { restoreCloudBackup, saveCloudBackup, useCloudBackupAt } from '@/data/cloud-backup';
import { syncConfigured } from '@/data/supabase';
import { useSession } from '@/data/sync';
import { backupAgeLabel } from '@/domain/backup';
import { SettingsPage } from '@/features/settings/settings-page';
import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/ui/confirm-dialog';
import { Text } from '@/ui/text';
import { space } from '@/ui/theme';

export function BackupScreen() {
  const session = useSession();
  const cloud = useCloudBackupAt();
  const [status, setStatus] = useState<{ text: string; failed: boolean } | null>(null);
  const [cloudStatus, setCloudStatus] = useState<{ text: string; failed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  async function runCloud(task: () => Promise<string>) {
    setBusy(true);
    setCloudStatus(null);

    try {
      setCloudStatus({ text: await task(), failed: false });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Não deu para concluir.';
      setCloudStatus({ text: reason, failed: true });
    } finally {
      setBusy(false);
      cloud.reload();
    }
  }

  async function save() {
    await runCloud(async () => {
      await saveCloudBackup(new Date());
      return 'Backup guardado na conta.';
    });
  }

  async function restore() {
    await runCloud(async () => {
      const summary = await restoreCloudBackup(new Date());
      if (summary === null) return 'Não há backup guardado nesta conta.';

      const total = summary.habits + summary.completions + summary.dayNotes;
      return total === 0
        ? 'Nada a restaurar: o backup é igual ao que está aqui.'
        : `Restaurado: ${plural(summary.habits, 'hábito', 'hábitos')}, ${plural(summary.completions, 'marcação', 'marcações')} e ${plural(summary.dayNotes, 'nota', 'notas')}.`;
    });
  }

  async function run(task: 'export' | 'import') {
    setBusy(true);
    setStatus(null);

    try {
      if (task === 'export') {
        const name = await exportBackup(new Date());
        if (name === null) return;

        setStatus({ text: `Exportado como ${name}.`, failed: false });
      } else {
        const summary = await importBackup();
        if (summary === null) return;

        setStatus({
          text:
            summary.habits + summary.completions + summary.dayNotes === 0
              ? 'Nada a aplicar: este backup já está aqui inteiro.'
              : `Importado: ${plural(summary.habits, 'hábito', 'hábitos')}, ${plural(summary.completions, 'marcação', 'marcações')} e ${plural(summary.dayNotes, 'nota', 'notas')}.`,
          failed: false,
        });
      }
    } catch (error) {
      // desistir do seletor nao chega aqui: os dois caminhos devolvem null antes
      const reason = error instanceof Error ? error.message : 'Não deu para concluir.';
      setStatus({ text: reason, failed: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage title="Backup">
      <View style={styles.block}>
        <Text variant="label" tone="inkFaint">
          Arquivo
        </Text>
        <Text variant="caption" tone="inkFaint">
          Um arquivo JSON com tudo, inclusive o que foi excluído. Reimportar o mesmo arquivo não
          muda nada.
        </Text>
        <View style={styles.actions}>
          <Button label="Exportar" variant="ghost" disabled={busy} onPress={() => run('export')} style={styles.action} />
          <Button label="Importar" variant="ghost" disabled={busy} onPress={() => run('import')} style={styles.action} />
        </View>
        {status === null ? null : (
          <Text variant="caption" tone={status.failed ? 'perigo' : 'inkMuted'}>
            {status.text}
          </Text>
        )}
      </View>

      <View style={styles.block}>
        <Text variant="label" tone="inkFaint">
          Na conta
        </Text>

        {!syncConfigured || session === null ? (
          <Text variant="caption" tone="inkFaint">
            Entre com o Google em Ajustes · Conta para guardar uma cópia na sua conta. Ela é
            trocada por uma nova a cada semana, e existe para desfazer um estrago que o sync já
            tenha espalhado.
          </Text>
        ) : (
          <>
            <Text variant="caption" tone="inkFaint">
              Uma cópia só, trocada a cada semana. O sync espelha o agora e leva o engano junto; o
              backup fica parado no dia em que foi feito.
            </Text>
            <Text variant="body" tabular>
              {cloud.loading ? 'Lendo…' : backupAgeLabel(cloud.at, new Date())}
            </Text>
            <View style={styles.actions}>
              <Button label="Guardar agora" variant="ghost" disabled={busy} onPress={save} style={styles.action} />
              <Button
                label="Restaurar"
                variant="ghost"
                disabled={busy || cloud.at === null}
                onPress={() => setRestoreOpen(true)}
                style={styles.action}
              />
            </View>
            {cloudStatus === null ? null : (
              <Text variant="caption" tone={cloudStatus.failed ? 'perigo' : 'inkMuted'}>
                {cloudStatus.text}
              </Text>
            )}
          </>
        )}
      </View>

      {/* restaurar vence a data: e destrutivo de propriedade, e por isso confirma nomeando o dia */}
      <ConfirmDialog
        visible={restoreOpen}
        destructive
        title="Restaurar o backup da conta?"
        message="O que estiver diferente volta a ser o que era no dia do backup, mesmo tendo mudado depois. O que você criou depois continua aqui."
        confirmLabel="Restaurar"
        onConfirm={restore}
        onClose={() => setRestoreOpen(false)}
      />
    </SettingsPage>
  );
}

function plural(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
});
