import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Trash2 from 'lucide-react-native/icons/trash-2';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import { Icon } from '@/ui/icon';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';

export function SettingsScreen() {
  const router = useRouter();
  const { data: active } = useLiveQuery(activeHabitsQuery);
  const { data: archived } = useLiveQuery(archivedHabitsQuery);

  function confirmDelete(habit: HabitRow) {
    Alert.alert(
      `Excluir ${habit.name}?`,
      'O histórico de marcações desse hábito vai junto. Não dá para desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteHabit(habit.id, new Date()),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={28} color={color.inkMuted} />
        </PressableScale>
        <Text variant="heading">Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                    onPress={() => confirmDelete(habit)}
                    style={styles.action}>
                    <Trash2 size={22} color={color.perigo} />
                  </PressableScale>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  action: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
