import * as Haptics from 'expo-haptics';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {
  addDays,
  addMonths,
  endOfMonth,
  startOfMonth,
  weekdayOf,
  type Day,
  type Month,
} from '@/domain/calendar';
import { duration as motion, EASE_OUT } from '@/ui/motion';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

/** Degrau fixo por breakpoint. Sem isso a celula seguiria a largura e viraria um circulo gigante. */
const cellHeight: Record<Breakpoint, number> = { compact: 48, medium: 52, expanded: 56 };

/** de onde o mes entra: consistencia espacial, para o dedo saber para que lado andou */
const SLIDE = 32;

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
  noteDays: ReadonlySet<Day>;
  onToggleDay: (day: Day) => void;
  onOpenNote: (day: Day) => void;
};

export function MonthCalendar({
  month,
  onMonthChange,
  today,
  completedDays,
  accent,
  noteDays,
  onToggleDay,
  onOpenNote,
}: Props) {
  const breakpoint = useBreakpoint();
  const shift = useSharedValue(0);
  const fade = useSharedValue(1);
  const height = cellHeight[breakpoint];
  const dot = height - space.sm;
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const blanks = weekdayOf(first);

  const days: Day[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);

  const [year, index] = month.split('-').map(Number);
  const atCurrentMonth = month >= today.slice(0, 7);

  function goTo(delta: number) {
    onMonthChange(addMonths(month, delta));

    shift.set(delta > 0 ? SLIDE : -SLIDE);
    fade.set(0.2);

    const timing = { duration: motion.toggle, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
    shift.set(withTiming(0, timing));
    fade.set(withTiming(1, timing));
  }

  const entering = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ translateX: shift.get() }],
  }));

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          onPress={() => goTo(-1)}
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
          onPress={() => goTo(1)}
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

      <Animated.View style={[styles.grid, entering]}>
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
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onOpenNote(day);
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

              {/* ponto indicador: o dia tem nota guardada */}
              {noteDays.has(day) ? (
                <View style={[styles.noteDot, { backgroundColor: done ? color.ink : accent }]} />
              ) : null}
            </PressableScale>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
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
  noteDot: { position: 'absolute', bottom: space.xs, width: 4, height: 4, borderRadius: radius.pill },
});
