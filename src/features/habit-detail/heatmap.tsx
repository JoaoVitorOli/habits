import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { addDays, monthOf, weekdayOf, type Day } from '@/domain/calendar';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const WEEKDAYS = ['', 'seg', '', 'qua', '', 'sex', ''];

const cellSize: Record<Breakpoint, number> = { compact: 14, medium: 16, expanded: 18 };

const WEEKS = 26;

type Props = {
  today: Day;
  completedDays: ReadonlySet<Day>;
  accent: string;
};

export function Heatmap({ today, completedDays, accent }: Props) {
  const breakpoint = useBreakpoint();
  const size = cellSize[breakpoint];
  const scroller = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(0);

  /* a semana corrente e a que interessa, entao o heatmap abre ancorado no fim. O deslocamento
     e calculado, nao pedido: scrollToEnd erra depois da rotacao, quando o conteudo nao muda
     de tamanho e so o container muda. */
  const contentWidth = WEEKS * size + (WEEKS - 1) * space.xs;

  useEffect(() => {
    scroller.current?.scrollTo({ x: Math.max(0, contentWidth - viewport), animated: false });
  }, [contentWidth, viewport]);

  const weeks: Day[][] = [];
  const lastWeekStart = addDays(today, -weekdayOf(today));

  for (let week = WEEKS - 1; week >= 0; week--) {
    const start = addDays(lastWeekStart, -week * 7);
    weeks.push(Array.from({ length: 7 }, (_, weekday) => addDays(start, weekday)));
  }

  return (
    <View style={styles.block}>
      <Text variant="label" tone="inkFaint">
        Últimos 6 meses
      </Text>

      <View style={styles.row}>
        <View style={styles.weekdayColumn}>
          {WEEKDAYS.map((label, weekday) => (
            <View key={weekday} style={{ height: size }}>
              <Text variant="caption" tone="inkFaint">
                {label}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
          contentContainerStyle={styles.grid}>
          {weeks.map((week, index) => {
            const previous = index === 0 ? null : weeks[index - 1][0];
            const startsMonth = previous === null || monthOf(previous) !== monthOf(week[0]);

            return (
              <View key={week[0]} style={styles.week}>
                <Text variant="caption" tone="inkFaint" style={styles.monthLabel}>
                  {startsMonth ? MONTHS[Number(week[0].slice(5, 7)) - 1] : ''}
                </Text>
                {week.map((day) => (
                  <View
                    key={day}
                    style={[
                      styles.cell,
                      { width: size, height: size },
                      day > today ? styles.future : null,
                      completedDays.has(day) ? { backgroundColor: accent } : null,
                    ]}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-end' },
  weekdayColumn: { gap: space.xs, paddingBottom: 0 },
  /* quando o conteudo cabe, o fim fica encostado a direita: a semana corrente e a ancora */
  grid: { flexDirection: 'row', gap: space.xs, flexGrow: 1, justifyContent: 'flex-end' },
  week: { gap: space.xs },
  monthLabel: { height: 16 },
  cell: { borderRadius: radius.sm / 2, backgroundColor: color.surfaceOverlay },
  future: { backgroundColor: color.surfaceRaised, opacity: 0.5 },
});
