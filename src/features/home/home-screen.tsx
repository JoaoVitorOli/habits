import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Plus from 'lucide-react-native/icons/plus';
import Settings from 'lucide-react-native/icons/settings';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completionsSince, toggleCompletion } from '@/data/completions';
import { activeHabitsQuery, scheduleOf } from '@/data/habits';
import type { HabitRow } from '@/data/schema';
import { addDays, type Day } from '@/domain/calendar';
import { paletteKeyOf } from '@/domain/palette';
import { currentStreak } from '@/domain/streak';
import { EmptyHome } from '@/features/home/empty-home';
import { GRID_WEEKS, HabitCard } from '@/features/home/habit-card';
import { DEFAULT_WEEK_STARTS_ON, useToday } from '@/features/use-today';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

/** Tablet ganha coluna, nao ganha tamanho. */
const columns: Record<Breakpoint, number> = { compact: 1, medium: 2, expanded: 3 };

const NO_DAYS: ReadonlySet<Day> = new Set();

export function HomeScreen() {
  const router = useRouter();
  const today = useToday();
  const breakpoint = useBreakpoint();

  const windowStart = addDays(today, -(GRID_WEEKS + 1) * 7);
  const { data: habits } = useLiveQuery(activeHabitsQuery);
  const { data: completions } = useLiveQuery(completionsSince(windowStart), [windowStart]);

  /* uma linha por (habito, dia): completo e `count >= targetPerDay` do proprio habito */
  const completedByHabit = useMemo(() => {
    const target = new Map(habits.map((habit) => [habit.id, habit.targetPerDay]));
    const byHabit = new Map<string, Set<Day>>();

    for (const completion of completions) {
      if (completion.count < (target.get(completion.habitId) ?? 1)) continue;
      const days = byHabit.get(completion.habitId) ?? new Set<Day>();
      days.add(completion.day);
      byHabit.set(completion.habitId, days);
    }

    return byHabit;
  }, [habits, completions]);

  const total = columns[breakpoint];
  const openForm = () => router.push('/habito/novo');

  function toggleToday(habit: HabitRow) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleCompletion(habit, today, new Date());
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          Hábitos
        </Text>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Visão geral"
          onPress={() => router.push('/visao-geral')}
          style={styles.action}>
          <ChartColumn size={24} color={color.inkMuted} />
        </PressableScale>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
          onPress={() => router.push('/ajustes')}
          style={styles.action}>
          <Settings size={24} color={color.inkMuted} />
        </PressableScale>
      </View>

      {habits.length === 0 ? (
        <EmptyHome onCreate={openForm} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.columns}>
            {habits.map((habit) => {
              const schedule = scheduleOf(habit);
              const completedDays = completedByHabit.get(habit.id) ?? NO_DAYS;

              return (
                <View key={habit.id} style={[styles.column, { width: `${100 / total}%` }]}>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${habit.name}`}
                    style={styles.card}
                    onPress={() => router.push({ pathname: '/habito/[id]', params: { id: habit.id } })}>
                    <HabitCard
                      today={today}
                      onToggleToday={() => toggleToday(habit)}
                      habit={{
                        name: habit.name,
                        icon: habit.icon,
                        color: paletteKeyOf(habit.color),
                        schedule,
                        completedDays,
                        currentStreak: currentStreak({
                          schedule,
                          completedDays,
                          today,
                          weekStartsOn: DEFAULT_WEEK_STARTS_ON,
                        }),
                      }}
                    />
                  </PressableScale>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Criar hábito"
        onPress={openForm}
        style={styles.fab}>
        <Plus size={28} color={color.ink} />
      </PressableScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
  },
  title: { flex: 1 },
  action: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: space.md, paddingBottom: space['3xl'] },
  columns: { flexDirection: 'row', flexWrap: 'wrap' },
  column: { padding: space.sm },
  card: { borderRadius: radius.xl },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.lg,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accent,
    shadowColor: withOpacity(color.accent, 1),
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
