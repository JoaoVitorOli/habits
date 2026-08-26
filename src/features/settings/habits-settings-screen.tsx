import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Trash2 from 'lucide-react-native/icons/trash-2';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { activeHabitsQuery, archivedHabitsQuery, deleteHabit, reorderHabits, restoreHabit } from '@/data/habits';
import type { HabitRow } from '@/data/schema';
import { paletteKeyOf } from '@/domain/palette';
import { ReorderList } from '@/features/settings/reorder-list';
import { SettingsPage } from '@/features/settings/settings-page';
import { ConfirmDialog } from '@/ui/confirm-dialog';
import { Icon } from '@/ui/icon';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';

export function HabitsSettingsScreen() {
  const { data: active } = useLiveQuery(activeHabitsQuery);
  const { data: archived } = useLiveQuery(archivedHabitsQuery);
  const [pendingDelete, setPendingDelete] = useState<HabitRow | null>(null);

  return (
    <SettingsPage title="Hábitos">
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
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
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
