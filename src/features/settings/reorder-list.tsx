import * as Haptics from 'expo-haptics';
import GripVertical from 'lucide-react-native/icons/grip-vertical';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { PaletteKey } from '@/domain/palette';
import { Icon, type IconRef } from '@/ui/icon';
import { duration, EASE_OUT } from '@/ui/motion';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';

const ROW = 72;

export type ReorderRowModel = {
  id: string;
  name: string;
  icon: IconRef;
  color: PaletteKey;
};

type Props = {
  rows: ReorderRowModel[];
  onCommit: (orderedIds: string[]) => void;
};

export function ReorderList({ rows, onCommit }: Props) {
  const order = useSharedValue(rows.map((row) => row.id));

  useEffect(() => {
    order.set(rows.map((row) => row.id));
  }, [rows, order]);

  return (
    <View style={{ height: rows.length * ROW }}>
      {rows.map((row) => (
        <Row key={row.id} row={row} order={order} count={rows.length} onCommit={onCommit} />
      ))}
    </View>
  );
}

type RowProps = {
  row: ReorderRowModel;
  order: SharedValue<string[]>;
  count: number;
  onCommit: (orderedIds: string[]) => void;
};

function Row({ row, order, count, onCommit }: RowProps) {
  const dragging = useSharedValue(false);
  const start = useSharedValue(0);
  const offset = useSharedValue(0);
  const index = useDerivedValue(() => order.get().indexOf(row.id));
  const accent = palette[row.color];

  // haptico ao cruzar um passo, nunca por frame
  useAnimatedReaction(
    () => index.get(),
    (current, previous) => {
      if (dragging.get() && previous !== null && current !== previous) {
        scheduleOnRN(Haptics.selectionAsync);
      }
    },
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      dragging.set(true);
      start.set(index.get());
      offset.set(index.get() * ROW);
    })
    .onUpdate((event) => {
      const y = start.get() * ROW + event.translationY;
      offset.set(y);

      const target = Math.max(0, Math.min(count - 1, Math.round(y / ROW)));
      const current = order.get();
      if (target === current.indexOf(row.id)) return;

      const next = current.filter((id) => id !== row.id);
      next.splice(target, 0, row.id);
      order.set(next);
    })
    .onEnd(() => {
      dragging.set(false);
      scheduleOnRN(onCommit, order.get());
    });

  const animated = useAnimatedStyle(() => {
    const lifted = dragging.get();
    return {
      transform: [
        {
          translateY: lifted
            ? offset.get()
            : withSpring(index.get() * ROW, {
                duration: duration.sheet,
                dampingRatio: 0.9,
                reduceMotion: ReduceMotion.System,
              }),
        },
        { scale: withTiming(lifted ? 1.03 : 1, { duration: duration.press, easing: EASE_OUT }) },
      ],
      zIndex: lifted ? 2 : 1,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.row, animated]}>
        <View style={[styles.square, { backgroundColor: withOpacity(accent, 0.16) }]}>
          <Icon icon={row.icon} size={20} color={accent} />
        </View>
        <Text variant="body" numberOfLines={1} style={styles.name}>
          {row.name}
        </Text>
        <GripVertical size={24} color={color.inkFaint} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW - space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
  square: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1 },
});
