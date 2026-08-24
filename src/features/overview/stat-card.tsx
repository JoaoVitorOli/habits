import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, EASE_OUT } from '@/ui/motion';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';

type Props = {
  label: string;
  value: string;
};

/**
 * O numero troca com crossfade: o valor que sai sobe e some, o que entra vem de baixo.
 * Sem isso a troca de mes muda tres numeros de uma vez sem dizer que mudou.
 */
export function StatCard({ label, value }: Props) {
  const [pair, setPair] = useState({ previous: value, current: value });
  if (pair.current !== value) setPair({ previous: pair.current, current: value });

  const { previous, current } = pair;
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.set(0);
    progress.set(
      withTiming(1, { duration: duration.toggle, easing: EASE_OUT, reduceMotion: ReduceMotion.System }),
    );
  }, [current, progress]);

  const incoming = useAnimatedStyle(() => {
    const value = progress.get();
    return { opacity: value, transform: [{ translateY: space.sm * (1 - value) }] };
  });

  const outgoing = useAnimatedStyle(() => {
    const value = progress.get();
    return { opacity: 1 - value, transform: [{ translateY: -space.sm * value }] };
  });

  return (
    <View style={styles.card}>
      <Text variant="label" tone="inkFaint">
        {label}
      </Text>

      <View>
        <Animated.View style={incoming}>
          <Text variant="heading" tabular numberOfLines={1}>
            {current}
          </Text>
        </Animated.View>

        {previous === current ? null : (
          <Animated.View style={[styles.leaving, outgoing]} pointerEvents="none">
            <Text variant="heading" tabular numberOfLines={1}>
              {previous}
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
  leaving: { position: 'absolute', top: 0, right: 0, left: 0 },
});
