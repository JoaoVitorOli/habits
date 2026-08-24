import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completionsOfHabit, toggleCompletion } from '@/data/completions';
import { habitByIdQuery, scheduleOf } from '@/data/habits';
import { monthOf, type Day } from '@/domain/calendar';
import { paletteKeyOf } from '@/domain/palette';
import { weekdaysOf, type Schedule } from '@/domain/schedule';
import { monthRate } from '@/domain/stats';
import { currentStreak, recordStreak, streakUnit } from '@/domain/streak';
import { DragToComplete } from '@/features/habit-detail/drag-to-complete';
import { Heatmap } from '@/features/habit-detail/heatmap';
import { MonthCalendar } from '@/features/habit-detail/month-calendar';
import { StreakCard } from '@/features/habit-detail/streak-card';
import { DEFAULT_WEEK_STARTS_ON, useToday } from '@/features/use-today';
import { Icon } from '@/ui/icon';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint } from '@/ui/use-breakpoint';

const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function scheduleLabel(schedule: Schedule): string {
  if (schedule.kind === 'timesPerWeek') {
    return schedule.times === 1 ? '1 vez por semana' : `${schedule.times} vezes por semana`;
  }

  const weekdays = weekdaysOf(schedule.days);
  if (weekdays.length === 7) return 'todo dia';
  if (weekdays.length === 0) return 'sem dia definido';
  return weekdays.map((weekday) => WEEKDAY_SHORT[weekday]).join(' · ');
}

export function HabitDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const today = useToday();
  const breakpoint = useBreakpoint();
  const [month, setMonth] = useState(() => monthOf(today));

  const { data: found } = useLiveQuery(habitByIdQuery(id), [id]);
  const { data: completions } = useLiveQuery(completionsOfHabit(id), [id]);
  const habit = found.at(0);

  const completedDays = useMemo(() => {
    const days = new Set<Day>();
    const target = habit?.targetPerDay ?? 1;
    for (const completion of completions) {
      if (completion.count >= target) days.add(completion.day);
    }
    return days;
  }, [completions, habit?.targetPerDay]);

  if (!habit) return <View style={styles.screen} />;

  const schedule = scheduleOf(habit);
  const accent = palette[paletteKeyOf(habit.color)];
  const unit = streakUnit(schedule);
  const input = { schedule, completedDays, today, weekStartsOn: DEFAULT_WEEK_STARTS_ON };
  const rate = monthRate({ schedule, completedDays, month, weekStartsOn: DEFAULT_WEEK_STARTS_ON });
  const wide = breakpoint !== 'compact';

  const toggle = (day: Day) => toggleCompletion(habit, day, new Date());

  const left = (
    <View style={styles.column}>
      <StreakCard
        current={currentStreak(input)}
        record={recordStreak(input)}
        unit={unit}
        accent={accent}
      />
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: withOpacity(accent, 0.12) }]}>
          <Text variant="label" tone="inkMuted" tabular>
            {Math.round(rate * 100)}% no mês
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: withOpacity(accent, 0.12) }]}>
          <Text variant="label" tone="inkMuted">
            {scheduleLabel(schedule)}
          </Text>
        </View>
      </View>
      {habit.description ? (
        <Text variant="body" tone="inkMuted">
          {habit.description}
        </Text>
      ) : null}
    </View>
  );

  const right = (
    <View style={styles.column}>
      <Heatmap today={today} completedDays={completedDays} accent={accent} />
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        today={today}
        completedDays={completedDays}
        accent={accent}
        onToggleDay={toggle}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()}>
          <ChevronLeft size={28} color={color.inkMuted} />
        </PressableScale>
        <View style={[styles.iconSquare, { backgroundColor: withOpacity(accent, 0.16) }]}>
          <Icon icon={habit.icon} size={24} color={accent} />
        </View>
        <Text variant="heading" numberOfLines={1} style={styles.name}>
          {habit.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={wide ? styles.wide : styles.narrow}>
          <View style={wide ? styles.half : undefined}>{left}</View>
          <View style={wide ? styles.half : undefined}>{right}</View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <DragToComplete
          done={completedDays.has(today)}
          accent={accent}
          onCommit={() => toggle(today)}
        />
      </View>
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
  iconSquare: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
  content: { padding: space.lg, paddingBottom: space['2xl'] },
  narrow: { gap: space.xl },
  wide: { flexDirection: 'row', gap: space.xl },
  /* sem minWidth 0 a coluna se estica para caber o heatmap e o scroll horizontal morre */
  half: { flex: 1, minWidth: 0 },
  column: { gap: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm },
  footer: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
    borderTopWidth: 1,
    borderTopColor: color.line,
    backgroundColor: color.surface,
  },
});
