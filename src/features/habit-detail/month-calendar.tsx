import * as Haptics from 'expo-haptics';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { StyleSheet, View } from 'react-native';

import {
  addDays,
  addMonths,
  endOfMonth,
  startOfMonth,
  weekdayOf,
  type Day,
  type Month,
} from '@/domain/calendar';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

/** Degrau fixo por breakpoint. Sem isso a celula seguiria a largura e viraria um circulo gigante. */
const cellHeight: Record<Breakpoint, number> = { compact: 48, medium: 52, expanded: 56 };

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type Props = {
  month: Month;
  onMonthChange: (month: Month) => void;
  today: Day;
  completedDays: ReadonlySet<Day>;
  accent: string;
  onToggleDay: (day: Day) => void;
};

export function MonthCalendar({ month, onMonthChange, today, completedDays, accent, onToggleDay }: Props) {
  const breakpoint = useBreakpoint();
  const height = cellHeight[breakpoint];
  const dot = height - space.sm;
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const blanks = weekdayOf(first);

  const days: Day[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);

  const [year, index] = month.split('-').map(Number);
  const atCurrentMonth = month >= today.slice(0, 7);

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => onMonthChange(addMonths(month, -1))}
          style={styles.arrow}>
          <ChevronLeft size={24} color={color.inkMuted} />
        </PressableScale>

        <Text variant="heading">
          {MONTH_NAMES[index - 1]} {year}
        </Text>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          disabled={atCurrentMonth}
          onPress={() => onMonthChange(addMonths(month, 1))}
          style={styles.arrow}>
          <ChevronRight size={24} color={atCurrentMonth ? color.inkDisabled : color.inkMuted} />
        </PressableScale>
      </View>

      <View style={styles.week}>
        {WEEKDAY_INITIALS.map((initial, weekday) => (
          <View key={weekday} style={[styles.cell, { height }]}>
            <Text variant="caption" tone="inkFaint">
              {initial}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: blanks }, (_, blank) => (
          <View key={`vazio-${blank}`} style={[styles.cell, { height }]} />
        ))}

        {days.map((day) => {
          const done = completedDays.has(day);
          const future = day > today;

          return (
            <PressableScale
              key={day}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done, disabled: future }}
              accessibilityLabel={day}
              disabled={future}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggleDay(day);
              }}
              style={[styles.cell, { height }]}>
              <View
                style={[
                  styles.dot,
                  { width: dot, height: dot },
                  done ? { backgroundColor: accent } : null,
                  day === today ? styles.todayRing : null,
                  future ? styles.future : null,
                ]}>
                <Text
                  variant="caption"
                  tone={done ? 'ink' : future ? 'inkDisabled' : 'inkMuted'}
                  tabular>
                  {Number(day.slice(8))}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center' },
  dot: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceRaised,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  /* o anel de hoje e claro: sobre o preenchido da cor do habito, um anel da mesma cor sumiria */
  todayRing: { borderColor: color.ink },
  future: { backgroundColor: withOpacity(color.ground, 0.6), opacity: 0.45 },
});
