import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completionsSince } from '@/data/completions';
import { activeHabitsQuery, scheduleOf } from '@/data/habits';
import { addDays, monthOf, startOfMonth, type Day } from '@/domain/calendar';
import { dayRatio, perfectDays, type HabitProgress } from '@/domain/overview';
import { paletteKeyOf } from '@/domain/palette';
import { isScheduled } from '@/domain/schedule';
import { monthRate } from '@/domain/stats';
import { currentStreak, streakUnit } from '@/domain/streak';
import { DaySummaryDialog } from '@/features/overview/day-summary-dialog';
import { HabitMatrix } from '@/features/overview/habit-matrix';
import { RingCalendar } from '@/features/overview/ring-calendar';
import { unitFor } from '@/features/streak-label';
import { DEFAULT_WEEK_STARTS_ON, useToday } from '@/features/use-today';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';
import { useBreakpoint } from '@/ui/use-breakpoint';

const NO_DAYS: ReadonlySet<Day> = new Set();

export function OverviewScreen() {
  const router = useRouter();
  const today = useToday();
  const breakpoint = useBreakpoint();
  const [month, setMonth] = useState(() => monthOf(today));
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  /* a janela cobre o mes visitado e os 30 dias da matriz, o que vier antes */
  const windowStart = useMemo(() => {
    const monthStart = startOfMonth(month);
    const matrixStart = addDays(today, -31);
    return monthStart < matrixStart ? monthStart : matrixStart;
  }, [month, today]);

  const { data: habits } = useLiveQuery(activeHabitsQuery);
  const { data: completions } = useLiveQuery(completionsSince(windowStart), [windowStart]);

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

  const rows = useMemo(
    () =>
      habits.map((habit) => ({
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: paletteKeyOf(habit.color),
        schedule: scheduleOf(habit),
        completedDays: completedByHabit.get(habit.id) ?? NO_DAYS,
      })),
    [habits, completedByHabit],
  );

  const progress: HabitProgress[] = rows;

  const monthAverage =
    rows.length === 0
      ? 0
      : rows.reduce(
          (total, row) =>
            total +
            monthRate({
              schedule: row.schedule,
              completedDays: row.completedDays,
              month,
              weekStartsOn: DEFAULT_WEEK_STARTS_ON,
            }),
          0,
        ) / rows.length;

  const bestStreak = rows.reduce(
    (best, row) => {
      const value = currentStreak({
        schedule: row.schedule,
        completedDays: row.completedDays,
        today,
        weekStartsOn: DEFAULT_WEEK_STARTS_ON,
      });
      return value > best.value ? { value, unit: streakUnit(row.schedule) } : best;
    },
    { value: 0, unit: 'dias' as 'dias' | 'semanas' },
  );

  const perfect = perfectDays(progress, addDays(today, -29), today);
  const wide = breakpoint !== 'compact';

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
        <Text variant="heading">Visão geral</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.numbers}>
          <Stat label="Taxa do mês" value={`${Math.round(monthAverage * 100)}%`} />
          <Stat label="Melhor sequência" value={`${bestStreak.value} ${unitFor(bestStreak.value, bestStreak.unit)}`} />
          <Stat label="Dias perfeitos" value={String(perfect)} />
        </View>

        <View style={wide ? styles.wide : styles.narrow}>
          <View style={wide ? styles.half : undefined}>
            <RingCalendar
              month={month}
              onMonthChange={setMonth}
              today={today}
              ratioOf={(day) => dayRatio(progress, day)}
              onSelectDay={setSelectedDay}
            />
          </View>

          <View style={wide ? styles.half : undefined}>
            <HabitMatrix rows={rows} today={today} />
          </View>
        </View>
      </ScrollView>

      <DaySummaryDialog
        day={selectedDay}
        rows={
          selectedDay === null
            ? []
            : rows
                .filter((row) => isScheduled(row.schedule, selectedDay))
                .map((row) => ({
                  id: row.id,
                  name: row.name,
                  icon: row.icon,
                  color: row.color,
                  done: row.completedDays.has(selectedDay),
                }))
        }
        onClose={() => setSelectedDay(null)}
      />
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="label" tone="inkFaint">
        {label}
      </Text>
      <Text variant="heading" tabular>
        {value}
      </Text>
    </View>
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
  action: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space['3xl'] },
  numbers: { flexDirection: 'row', gap: space.sm },
  stat: {
    flex: 1,
    minWidth: 0,
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
  narrow: { gap: space.xl },
  wide: { flexDirection: 'row', gap: space.xl },
  half: { flex: 1, minWidth: 0 },
});
