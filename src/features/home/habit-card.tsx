import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { addDays, weekdayOf, type Day } from '@/domain/calendar';
import type { PaletteKey } from '@/domain/palette';
import type { Schedule } from '@/domain/schedule';
import { streakUnit } from '@/domain/streak';
import { MarkButton } from '@/features/home/mark-button';
import { streakLabel } from '@/features/streak-label';
import { Icon, type IconRef } from '@/ui/icon';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

export type HabitCardModel = {
  name: string;
  icon: IconRef;
  color: PaletteKey;
  schedule: Schedule;
  currentStreak: number;
  completedDays: ReadonlySet<Day>;
};

/** Celula do grid cresce em degraus fixos, nunca por escala continua sobre a largura. */
const cellSize: Record<Breakpoint, number> = { compact: 10, medium: 12, expanded: 14 };

export const GRID_WEEKS = 14;

function gridDays(today: Day): Day[][] {
  const lastColumnStart = addDays(today, -weekdayOf(today));
  const weeks: Day[][] = [];

  for (let week = GRID_WEEKS - 1; week >= 0; week--) {
    const start = addDays(lastColumnStart, -week * 7);
    weeks.push(Array.from({ length: 7 }, (_, weekday) => addDays(start, weekday)));
  }

  return weeks;
}

type Props = {
  habit: HabitCardModel;
  today: Day;
  onToggleToday?: () => void;
};

export function HabitCard({ habit, today, onToggleToday }: Props) {
  const breakpoint = useBreakpoint();
  const accent = palette[habit.color];
  const size = cellSize[breakpoint];
  const doneToday = habit.completedDays.has(today);
  const unit = streakUnit(habit.schedule);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconSquare, { backgroundColor: withOpacity(accent, 0.16) }]}>
          <Icon icon={habit.icon} size={24} color={accent} />
        </View>
        <View style={styles.identity}>
          <Text variant="heading" numberOfLines={1}>
            {habit.name}
          </Text>
          <Text variant="caption" tone="inkMuted" tabular>
            {streakLabel(habit.currentStreak, unit)}
          </Text>
        </View>
        {onToggleToday ? (
          <MarkButton
            done={doneToday}
            accent={accent}
            label={doneToday ? `Desmarcar ${habit.name} hoje` : `Marcar ${habit.name} hoje`}
            onPress={onToggleToday}
          />
        ) : null}
      </View>

      {/* o grid do card e so leitura: marcar acontece no botao e na tela de detalhe */}
      <View style={styles.grid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {gridDays(today).map((week) => (
          <View key={week[0]} style={styles.week}>
            {week.map((day) =>
              day === today ? (
                <TodayCell key={day} done={doneToday} size={size} accent={accent} />
              ) : (
                <View
                  key={day}
                  style={[
                    styles.cell,
                    { width: size, height: size },
                    day > today ? styles.future : null,
                    habit.completedDays.has(day) ? { backgroundColor: accent } : null,
                  ]}
                />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

/** So a bolinha de hoje anima: as outras 97 sao View comum, e ninguem sente falta. */
function TodayCell({ done, size, accent }: { done: boolean; size: number; accent: string }) {
  const progress = useSharedValue(done ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.set(
      withSpring(done ? 1 : 0, { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System }),
    );
    // o crescimento e um pulso, nao um estado: uma bolinha maior para sempre mentiria sobre o grid
    pulse.set(
      withSequence(
        withTiming(done ? 1.35 : 0.85, { duration: 120, reduceMotion: ReduceMotion.System }),
        withSpring(1, { duration: 400, dampingRatio: 0.7, reduceMotion: ReduceMotion.System }),
      ),
    );
  }, [done, progress, pulse]);

  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], [color.surfaceOverlay, accent]),
    transform: [{ scale: pulse.get() }],
  }));

  return <Animated.View style={[styles.cell, { width: size, height: size }, animated]} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.xl,
    borderTopWidth: 1,
    borderTopColor: color.edge,
    padding: space.md,
    gap: space.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1, gap: space.xs },
  grid: { flexDirection: 'row', gap: space.xs },
  week: { gap: space.xs },
  cell: { borderRadius: radius.sm / 2, backgroundColor: color.surfaceOverlay },
  future: { backgroundColor: color.surfaceRaised, opacity: 0.5 },
});
