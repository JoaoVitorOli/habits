import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { addDays, type Day } from '@/domain/calendar';
import type { PaletteKey } from '@/domain/palette';
import { isScheduled, type Schedule } from '@/domain/schedule';
import { Icon, type IconRef } from '@/ui/icon';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

const DAYS = 30;
const cellSize: Record<Breakpoint, number> = { compact: 8, medium: 10, expanded: 12 };

export type MatrixRow = {
  id: string;
  name: string;
  icon: IconRef;
  color: PaletteKey;
  schedule: Schedule;
  completedDays: ReadonlySet<Day>;
};

type Props = {
  rows: MatrixRow[];
  today: Day;
};

export function HabitMatrix({ rows, today }: Props) {
  const breakpoint = useBreakpoint();
  const size = cellSize[breakpoint];
  const scroller = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(0);

  const days = Array.from({ length: DAYS }, (_, index) => addDays(today, index - (DAYS - 1)));
  const contentWidth = DAYS * size + (DAYS - 1) * space.xs;

  useEffect(() => {
    scroller.current?.scrollTo({ x: Math.max(0, contentWidth - viewport), animated: false });
  }, [contentWidth, viewport]);

  return (
    <View style={styles.block}>
      <Text variant="label" tone="inkFaint">
        Últimos 30 dias
      </Text>

      <View style={styles.row}>
        <View style={styles.icons}>
          {rows.map((row) => (
            <View key={row.id} style={[styles.square, { backgroundColor: withOpacity(palette[row.color], 0.16) }]}>
              <Icon icon={row.icon} size={16} color={palette[row.color]} />
            </View>
          ))}
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => setViewport(event.nativeEvent.layout.width)}
          contentContainerStyle={styles.grid}>
          <View style={styles.lines}>
            {rows.map((row) => (
              <View key={row.id} style={styles.line}>
                {days.map((day) => {
                  const done = row.completedDays.has(day);
                  const scheduled = isScheduled(row.schedule, day);

                  return (
                    <View
                      key={day}
                      style={[
                        styles.cell,
                        { width: size, height: size },
                        done ? { backgroundColor: palette[row.color] } : null,
                        !done && !scheduled ? styles.neutral : null,
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  icons: { gap: space.sm },
  square: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* quando o conteudo cabe, o fim fica encostado a direita: o dia de hoje e a ancora */
  grid: { flexDirection: 'row', flexGrow: 1, justifyContent: 'flex-end' },
  lines: { gap: space.sm },
  line: { height: 32, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  cell: { borderRadius: radius.sm / 2, backgroundColor: color.surfaceOverlay },
  /* dia nao agendado e neutro: nem cobranca, nem conquista */
  neutral: { backgroundColor: color.surfaceRaised, opacity: 0.5 },
});
