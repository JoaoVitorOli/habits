import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, EASE_OUT } from '@/ui/motion';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

type Props = {
  current: number;
  record: number;
  goal: number | null;
  progress: number | null;
  unit: 'dias' | 'semanas';
  accent: string;
  onEditGoal: () => void;
};

/** pt-BR nao aceita "1 semanas": a unidade concorda com o numero. */
function unitFor(value: number, unit: 'dias' | 'semanas'): string {
  if (value === 1) return unit === 'dias' ? 'dia' : 'semana';
  return unit;
}

export function StreakCard({ current, record, goal, progress, unit, accent, onEditGoal }: Props) {
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

      <View style={styles.top}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Editar meta de sequência"
          onPress={onEditGoal}
          style={[styles.editGoal, { borderColor: withOpacity(accent, 0.4) }]}>
          <Text variant="label" tone="inkMuted">
            {goal === null ? 'Definir meta' : 'Editar meta'}
          </Text>
        </PressableScale>
      </View>

      <View style={styles.center}>
        <Text variant="label" tone="inkFaint">
          Sequência atual
        </Text>
        <Text variant="display" tabular style={{ color: accent }}>
          {current}
        </Text>
        <Text variant="label" tone="inkMuted">
          {unitFor(current, unit)}
        </Text>
      </View>

      {goal !== null && progress !== null ? (
        <View style={styles.goal}>
          <GoalBar progress={progress} accent={accent} />
          <View style={styles.goalLine}>
            <Text variant="label" tone="inkFaint">
              Sua meta
            </Text>
            <Text variant="label" tone="inkMuted" tabular>
              {goal} {unitFor(goal, unit)} · {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.record, { backgroundColor: withOpacity(accent, 0.12) }]}>
        <Text variant="label" tone="inkFaint">
          Recorde
        </Text>
        <Text variant="heading" tabular>
          {record} {unitFor(record, unit)}
        </Text>
      </View>
    </View>
  );
}

/** Barra absoluta e sem filhos: e o unico lugar onde animar largura nao custa layout. */
function GoalBar({ progress, accent }: { progress: number; accent: string }) {
  const filled = useSharedValue(progress);

  useEffect(() => {
    filled.set(
      withTiming(progress, { duration: duration.sheet, easing: EASE_OUT, reduceMotion: ReduceMotion.System }),
    );
  }, [progress, filled]);

  const fill = useAnimatedStyle(() => ({ width: `${filled.get() * 100}%` }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: accent }, fill]} />
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
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  editGoal: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  center: { alignItems: 'center', gap: space.xs },
  goal: { gap: space.sm },
  track: {
    height: space.sm,
    borderRadius: radius.pill,
    backgroundColor: color.surfaceOverlay,
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: radius.pill },
  goalLine: { flexDirection: 'row', justifyContent: 'space-between' },
  record: {
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    alignItems: 'center',
    gap: space.xs,
  },
});
