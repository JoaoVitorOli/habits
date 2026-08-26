import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { exportBackup, importBackup } from '@/data/backup';
import { SettingsPage } from '@/features/settings/settings-page';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { space } from '@/ui/theme';

export function BackupScreen() {
  const [status, setStatus] = useState<{ text: string; failed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

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
