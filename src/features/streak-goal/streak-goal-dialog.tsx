import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { StreakGoalPicker } from '@/features/streak-goal/streak-goal-picker';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';
import { useOverlayTransition } from '@/ui/use-overlay-transition';

type Props = {
  visible: boolean;
  value: number | null;
  unit: 'dias' | 'semanas';
  accent: string;
  onChange: (goal: number | null) => void;
  onClose: () => void;
};

export function StreakGoalDialog({ visible, value, unit, accent, onChange, onClose }: Props) {
  const { mounted, progress } = useOverlayTransition(visible);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() * 0.7 }));

  const card = useAnimatedStyle(() => {
    const current = progress.get();
    return {
      opacity: current,
      transform: [{ translateY: space.md * (1 - current) }, { scale: 0.96 + 0.04 * current }],
    };
  });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Fechar">
        <Animated.View style={[styles.backdrop, backdrop]} pointerEvents="none" />

        <View style={styles.center} pointerEvents="box-none">
          <Pressable onPress={() => undefined} style={styles.wrapper}>
            <Animated.View style={[styles.card, card]}>
              <View style={styles.words}>
                <Text variant="heading">Meta de sequência</Text>
                <Text variant="body" tone="inkMuted">
                  Até onde você quer levar essa sequência sem quebrar.
                </Text>
              </View>

              <StreakGoalPicker
                value={value}
                unit={unit}
                accent={accent}
                onChange={(goal) => {
                  onChange(goal);
                  onClose();
                }}
              />
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
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
    gap: space.lg,
    shadowColor: color.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  words: { gap: space.sm },
});
