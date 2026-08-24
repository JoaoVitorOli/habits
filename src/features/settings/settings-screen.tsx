import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Trash2 from 'lucide-react-native/icons/trash-2';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { exportBackup, importBackup } from '@/data/backup';
import {
  activeHabitsQuery,
  archivedHabitsQuery,
  deleteHabit,
  reorderHabits,
  restoreHabit,
} from '@/data/habits';
import type { HabitRow } from '@/data/schema';
import { paletteKeyOf } from '@/domain/palette';
import { ReorderList } from '@/features/settings/reorder-list';
import { SyncCard } from '@/features/settings/sync-card';
import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/ui/confirm-dialog';
import { Icon } from '@/ui/icon';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';

/** pt-BR concorda em numero: "1 nota", "9 marcações". */
function plural(value: number, singular: string, many: string): string {
  return `${value} ${value === 1 ? singular : many}`;
}

export function SettingsScreen() {
  const router = useRouter();
  const { data: active } = useLiveQuery(activeHabitsQuery);
  const { data: archived } = useLiveQuery(archivedHabitsQuery);
  const [pendingDelete, setPendingDelete] = useState<HabitRow | null>(null);
  const [backupStatus, setBackupStatus] = useState<{ text: string; failed: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function runBackup(task: 'export' | 'import') {
    setBusy(true);
    setBackupStatus(null);

    try {
      if (task === 'export') {
        const name = await exportBackup(new Date());
        setBackupStatus({ text: `Exportado como ${name}.`, failed: false });
      } else {
        const summary = await importBackup();
        if (summary === null) return;

        setBackupStatus({
          text:
            summary.habits + summary.completions + summary.dayNotes === 0
              ? 'Nada a aplicar: este backup já está aqui inteiro.'
              : `Importado: ${plural(summary.habits, 'hábito', 'hábitos')}, ${plural(summary.completions, 'marcação', 'marcações')} e ${plural(summary.dayNotes, 'nota', 'notas')}.`,
          failed: false,
        });
      }
    } catch (error) {
      // cancelar o seletor de arquivo tambem cai aqui, e nao e falha do usuario
      const reason = error instanceof Error ? error.message : 'Não deu para concluir.';
      setBackupStatus({ text: reason, failed: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.action}>
          <ChevronLeft size={28} color={color.inkMuted} />
        </PressableScale>
        <Text variant="heading">Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SyncCard />

        <View style={styles.block}>
          <Text variant="label" tone="inkFaint">
            Ordem na home
          </Text>
          {active.length === 0 ? (
            <Text variant="body" tone="inkMuted">
              Nenhum hábito ativo.
            </Text>
          ) : (
            <>
              <Text variant="caption" tone="inkFaint">
                Segure e arraste para reordenar.
              </Text>
              <ReorderList
                rows={active.map((habit) => ({
                  id: habit.id,
                  name: habit.name,
                  icon: habit.icon,
                  color: paletteKeyOf(habit.color),
                }))}
                onCommit={(orderedIds) => reorderHabits(orderedIds, new Date())}
              />
            </>
          )}
        </View>

        <View style={styles.block}>
          <Text variant="label" tone="inkFaint">
            Backup
          </Text>
          <Text variant="caption" tone="inkFaint">
            Um arquivo JSON com tudo, inclusive o que foi excluído. Reimportar o mesmo arquivo não
            muda nada.
          </Text>
          <View style={styles.backupActions}>
            <Button
              label="Exportar"
              variant="ghost"
              disabled={busy}
              onPress={() => runBackup('export')}
              style={styles.backupAction}
            />
            <Button
              label="Importar"
              variant="ghost"
              disabled={busy}
              onPress={() => runBackup('import')}
              style={styles.backupAction}
            />
          </View>
          {backupStatus === null ? null : (
            <Text variant="caption" tone={backupStatus.failed ? 'perigo' : 'inkMuted'}>
              {backupStatus.text}
            </Text>
          )}
        </View>

        <View style={styles.block}>
          <Text variant="label" tone="inkFaint">
            Arquivados
          </Text>
          {archived.length === 0 ? (
            <Text variant="body" tone="inkMuted">
              Nada arquivado.
            </Text>
          ) : (
            archived.map((habit) => {
              const accent = palette[paletteKeyOf(habit.color)];

              return (
                <View key={habit.id} style={styles.row}>
                  <View style={[styles.square, { backgroundColor: withOpacity(accent, 0.16) }]}>
                    <Icon icon={habit.icon} size={20} color={accent} />
                  </View>
                  <Text variant="body" numberOfLines={1} style={styles.name}>
                    {habit.name}
                  </Text>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Restaurar ${habit.name}`}
                    onPress={() => restoreHabit(habit.id, new Date())}
                    style={styles.action}>
                    <RotateCcw size={22} color={color.inkMuted} />
                  </PressableScale>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${habit.name}`}
                    onPress={() => setPendingDelete(habit)}
                    style={styles.action}>
                    <Trash2 size={22} color={color.perigo} />
                  </PressableScale>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        destructive
        title={`Excluir ${pendingDelete?.name ?? ''}?`}
        message="O histórico de marcações desse hábito vai junto. Não dá para desfazer."
        confirmLabel="Excluir"
        onConfirm={() => {
          if (pendingDelete) deleteHabit(pendingDelete.id, new Date());
        }}
        onClose={() => setPendingDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space['3xl'] },
  block: { gap: space.sm },
  backupActions: { flexDirection: 'row', gap: space.sm },
  backupAction: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
  },
  square: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  action: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
