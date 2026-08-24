import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import {
  addDays,
  addMonths,
  endOfMonth,
  startOfMonth,
  weekdayOf,
  type Day,
  type Month,
} from '@/domain/calendar';
import { duration, EASE_OUT } from '@/ui/motion';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const ringSize: Record<Breakpoint, number> = { compact: 36, medium: 40, expanded: 44 };
const STROKE = 4;

/** de onde o mes entra: consistencia espacial, para o dedo saber para que lado andou */
const SLIDE = 32;

type Props = {
  month: Month;
  onMonthChange: (month: Month) => void;
  today: Day;
  ratioOf: (day: Day) => number | null;
  onSelectDay: (day: Day) => void;
};

export function RingCalendar({ month, onMonthChange, today, ratioOf, onSelectDay }: Props) {
  const breakpoint = useBreakpoint();
  const shift = useSharedValue(0);
  const fade = useSharedValue(1);
  const size = ringSize[breakpoint];
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const blanks = weekdayOf(first);

  const days: Day[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);

  const [year, index] = month.split('-').map(Number);
  const atCurrentMonth = month >= today.slice(0, 7);

  /* o mes novo entra do lado para onde o dedo andou: avancar traz da direita, voltar da esquerda */
  function goTo(delta: number) {
    onMonthChange(addMonths(month, delta));

    shift.set(delta > 0 ? SLIDE : -SLIDE);
    fade.set(0.2);

    const timing = { duration: duration.toggle, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
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

      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((initial, weekday) => (
          <View key={weekday} style={styles.cell}>
            <Text variant="caption" tone="inkFaint">
              {initial}
            </Text>
          </View>
        ))}
      </View>

      <Animated.View style={[styles.grid, entering]}>
        {Array.from({ length: blanks }, (_, blank) => (
          <View key={`vazio-${blank}`} style={[styles.cell, { height: size + space.sm }]} />
        ))}

        {days.map((day) => (
          <PressableScale
            key={day}
            accessibilityRole="button"
            accessibilityLabel={day}
            disabled={day > today}
            onPress={() => onSelectDay(day)}
            style={[styles.cell, { height: size + space.sm }]}>
            <DayRing size={size} ratio={ratioOf(day)} muted={day > today} today={day === today} />
            <Text variant="caption" tone={day > today ? 'inkDisabled' : 'inkMuted'} tabular>
              {Number(day.slice(8))}
            </Text>
          </PressableScale>
        ))}
      </Animated.View>
    </View>
  );
}

/** O anel e sempre violeta: ele fala do dia inteiro, nao de um habito. */
function DayRing({
  size,
  ratio,
  muted,
  today,
}: {
  size: number;
  ratio: number | null;
  muted: boolean;
  today: boolean;
}) {
  const center = size / 2;
  const radiusOf = center - STROKE / 2;
  const circumference = 2 * Math.PI * radiusOf;
  const filled = ratio === null ? 0 : ratio;

  return (
    <Svg width={size} height={size} style={styles.ring}>
      <Circle
        cx={center}
        cy={center}
        r={radiusOf}
        stroke={today ? color.ink : color.surfaceOverlay}
        strokeWidth={today ? 2 : STROKE}
        opacity={muted ? 0.4 : 1}
        fill="none"
      />
      {filled > 0 ? (
        <Circle
          cx={center}
          cy={center}
          r={radiusOf}
          stroke={color.accent}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${circumference * filled} ${circumference}`}
          transform={`rotate(-90 ${center} ${center})`}
          fill="none"
        />
      ) : null}
    </Svg>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { position: 'absolute' },
});
