import { StyleSheet, View } from 'react-native';

import { addDays, weekdayOf, type Day } from '@/domain/calendar';
import { Icon, type IconRef } from '@/ui/icon';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity, type PaletteKey } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

export type HabitCardModel = {
  name: string;
  icon: IconRef;
  color: PaletteKey;
  currentStreak: number;
  completedDays: ReadonlySet<Day>;
};

/** Celula do grid cresce em degraus fixos, nunca por escala continua sobre a largura. */
const cellSize: Record<Breakpoint, number> = { compact: 10, medium: 12, expanded: 14 };

const WEEKS = 14;

function gridDays(today: Day): Day[][] {
  const lastColumnStart = addDays(today, -weekdayOf(today));
  const weeks: Day[][] = [];

  for (let week = WEEKS - 1; week >= 0; week--) {
    const start = addDays(lastColumnStart, -week * 7);
    weeks.push(Array.from({ length: 7 }, (_, weekday) => addDays(start, weekday)));
  }

  return weeks;
}

type Props = {
  habit: HabitCardModel;
  today: Day;
};

export function HabitCard({ habit, today }: Props) {
  const breakpoint = useBreakpoint();
  const accent = palette[habit.color];
  const size = cellSize[breakpoint];

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
            {habit.currentStreak === 1 ? '1 dia seguido' : `${habit.currentStreak} dias seguidos`}
          </Text>
        </View>
      </View>

      {/* o grid do card e so leitura: marcar acontece no botao e na tela de detalhe */}
      <View style={styles.grid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {gridDays(today).map((week) => (
          <View key={week[0]} style={styles.week}>
            {week.map((day) => {
              const done = habit.completedDays.has(day);
              return (
                <View
                  key={day}
                  style={[
                    styles.cell,
                    { width: size, height: size },
                    day > today ? styles.future : null,
                    done ? { backgroundColor: accent } : null,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
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
