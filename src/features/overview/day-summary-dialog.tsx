import Check from 'lucide-react-native/icons/check';
import Minus from 'lucide-react-native/icons/minus';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { Day } from '@/domain/calendar';
import type { PaletteKey } from '@/domain/palette';
import { Icon, type IconRef } from '@/ui/icon';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';
import { useOverlayTransition } from '@/ui/use-overlay-transition';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export type DaySummaryRow = {
  id: string;
  name: string;
  icon: IconRef;
  color: PaletteKey;
  done: boolean;
};

type Props = {
  day: Day | null;
  rows: DaySummaryRow[];
  onClose: () => void;
};

export function DaySummaryDialog({ day, rows, onClose }: Props) {
  const { mounted, progress } = useOverlayTransition(day !== null);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() * 0.7 }));

  const card = useAnimatedStyle(() => {
    const current = progress.get();
    return {
      opacity: current,
      transform: [{ translateY: space.md * (1 - current) }, { scale: 0.96 + 0.04 * current }],
    };
  });

  const done = rows.filter((row) => row.done).length;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Fechar">
        <Animated.View style={[styles.backdrop, backdrop]} pointerEvents="none" />

        <View style={styles.center} pointerEvents="box-none">
          <Pressable onPress={() => undefined} style={styles.wrapper}>
            <Animated.View style={[styles.card, card]}>
              <View style={styles.words}>
                <Text variant="heading">{day === null ? '' : readableDay(day)}</Text>
                <Text variant="body" tone="inkMuted" tabular>
                  {rows.length === 0
                    ? 'Nenhum hábito agendado nesse dia.'
                    : `${done} de ${rows.length} cumpridos`}
                </Text>
              </View>

              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {rows.map((row) => {
                  const accent = palette[row.color];

                  return (
                    <View key={row.id} style={styles.row}>
                      <View style={[styles.square, { backgroundColor: withOpacity(accent, 0.16) }]}>
                        <Icon icon={row.icon} size={18} color={accent} />
                      </View>
                      <Text variant="body" numberOfLines={1} style={styles.name}>
                        {row.name}
                      </Text>
                      {row.done ? (
                        <Check size={20} color={accent} strokeWidth={3} />
                      ) : (
                        <Minus size={20} color={color.inkFaint} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function readableDay(day: Day): string {
  const [, month, date] = day.split('-');
  return `${Number(date)} de ${MONTH_NAMES[Number(month) - 1]}`;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.ground },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  wrapper: { width: '100%', maxWidth: 420 },
  card: {
    backgroundColor: color.surfaceOverlay,
    borderRadius: radius.xl,
    borderTopWidth: 1,
    borderTopColor: color.edge,
    padding: space.lg,
    gap: space.md,
    shadowColor: color.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  words: { gap: space.xs },
  list: { maxHeight: 320 },
  listContent: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  square: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
});
