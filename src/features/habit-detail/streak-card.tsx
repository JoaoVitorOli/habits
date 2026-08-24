import { StyleSheet, View } from 'react-native';

import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

type Props = {
  current: number;
  record: number;
  unit: 'dias' | 'semanas';
  accent: string;
};

export function StreakCard({ current, record, unit, accent }: Props) {
  return (
    <View style={[styles.card, { shadowColor: accent }]}>
      {/* numerais fantasma: profundidade por luz, nunca por sombra dura */}
      <View style={styles.ghosts} pointerEvents="none">
        <Text variant="display" tone="inkDisabled" tabular style={styles.ghostNear}>
          {Math.max(0, current - 1)}
        </Text>
        <Text variant="display" tone="inkDisabled" tabular style={styles.ghostFar}>
          {current + 1}
        </Text>
      </View>

      <View style={styles.center}>
        <Text variant="label" tone="inkFaint">
          Sequência atual
        </Text>
        <Text variant="display" tabular style={{ color: accent }}>
          {current}
        </Text>
        <Text variant="label" tone="inkMuted">
          {unit}
        </Text>
      </View>

      <View style={[styles.record, { backgroundColor: withOpacity(accent, 0.12) }]}>
        <Text variant="label" tone="inkFaint">
          Recorde
        </Text>
        <Text variant="heading" tabular>
          {record} {unit}
        </Text>
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
    padding: space.lg,
    gap: space.md,
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  ghosts: {
    position: 'absolute',
    top: 0,
    right: space.md,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  ghostNear: { textAlign: 'right', opacity: 0.12 },
  ghostFar: { textAlign: 'right', opacity: 0.07 },
  center: { alignItems: 'center', gap: space.xs },
  record: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
});
