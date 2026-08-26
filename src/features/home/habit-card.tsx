import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  ReduceMotion,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { usePreferences } from '@/data/settings';
import { weekColumns, type Day } from '@/domain/calendar';
import type { PaletteKey } from '@/domain/palette';
import type { Schedule } from '@/domain/schedule';
import { streakUnit } from '@/domain/streak';
import { MarkButton } from '@/features/home/mark-button';
import { streakLabel } from '@/features/streak-label';
import { Icon, type IconRef } from '@/ui/icon';
import { duration, EASE_SHEET } from '@/ui/motion';
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
  /** marcacoes de hoje e quantas o dia pede: uma meta de tres precisa mostrar 1/3 */
  todayCount: number;
  targetPerDay: number;
};

/** Celula do grid cresce em degraus fixos, nunca por escala continua sobre a largura. */
const cellSize: Record<Breakpoint, number> = { compact: 10, medium: 12, expanded: 14 };

export const GRID_WEEKS = 14;

const WEEK_ROWS = 7;

/**
 * Trocar de modo e um morph do mesmo card, nao a troca de um componente por outro: a grade
 * fecha e a altura acompanha. A curva e a do sheet — sai rapido e assenta devagar, que e o
 * contrario de um corte — e e a mesma nos dois sentidos, porque o gesto e reversivel.
 */
const timing = { duration: duration.sheet, easing: EASE_SHEET, reduceMotion: ReduceMotion.System };

type Props = {
  habit: HabitCardModel;
  today: Day;
  /** modo compacto: o card e o mesmo, sem a grade */
  compact?: boolean;
  onToggleToday?: () => void;
};

export function HabitCard({ habit, today, compact = false, onToggleToday }: Props) {
  const breakpoint = useBreakpoint();
  const { weekStartsOn } = usePreferences();
  const accent = palette[habit.color];
  const size = cellSize[breakpoint];
  const doneToday = habit.completedDays.has(today);
  const unit = streakUnit(habit.schedule);
  const { mounted, progress } = useGrid(compact);

  /* a altura da grade e deterministica: sete linhas e os vaos entre elas. Nao precisa medir. */
  const gridHeight = WEEK_ROWS * size + (WEEK_ROWS - 1) * space.xs;

  const card = useAnimatedStyle(() => ({
    padding: interpolate(progress.get(), [0, 1], [space.sm, space.md]),
  }));

  const grid = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      height: value * gridHeight,
      marginTop: value * space.md,
      // a grade some antes de a altura fechar: bolinha cortada pela metade seria o brusco
      opacity: interpolate(value, [0.45, 1], [0, 1], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[styles.card, card]}>
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
            count={habit.todayCount}
            target={habit.targetPerDay}
            accent={accent}
            label={doneToday ? `Desmarcar ${habit.name} hoje` : `Marcar ${habit.name} hoje`}
            onPress={onToggleToday}
          />
        ) : null}
      </View>

      {/* o grid do card e so leitura: marcar acontece no botao e na tela de detalhe */}
      {mounted ? (
        <Animated.View
          style={[styles.grid, grid]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {weekColumns(today, GRID_WEEKS, weekStartsOn).map((week) => (
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
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

/**
 * A grade sai do card de vez — 98 Views por hábito é o que o modo compacto existe para não
 * pagar —, mas só depois que a altura fecha: desmontar no primeiro frame encolheria um card
 * já vazio, que é justamente o corte que não queremos ver.
 */
function useGrid(compact: boolean): { mounted: boolean; progress: SharedValue<number> } {
  const progress = useSharedValue(compact ? 0 : 1);
  const [mounted, setMounted] = useState(!compact);

  if (!compact && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;

    progress.set(
      withTiming(compact ? 0 : 1, timing, (finished) => {
        if (finished && compact) scheduleOnRN(setMounted, false);
      }),
    );
  }, [compact, mounted, progress]);

  return { mounted, progress };
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
  /* a altura e a margem sao animadas: o que sobra do vao precisa ser cortado, nao empurrado */
  grid: { flexDirection: 'row', gap: space.xs, overflow: 'hidden' },
  week: { gap: space.xs },
  cell: { borderRadius: radius.sm / 2, backgroundColor: color.surfaceOverlay },
  future: { backgroundColor: color.surfaceRaised, opacity: 0.5 },
});
