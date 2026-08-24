import Check from 'lucide-react-native/icons/check';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/ui/pressable-scale';
import { color, radius, withOpacity } from '@/ui/theme';

type Props = {
  done: boolean;
  accent: string;
  label: string;
  onPress: () => void;
};

/** Marcar e raro e e o momento do app: aqui cabe mola, nao so um corte de cor. */
export function MarkButton({ done, accent, label, onPress }: Props) {
  const progress = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    progress.set(
      withSpring(done ? 1 : 0, { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System }),
    );
  }, [done, progress]);

  const fill = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const glyph = useAnimatedStyle(() => {
    const value = progress.get();
    return { opacity: 0.35 + 0.65 * value, transform: [{ scale: 0.85 + 0.15 * value }] };
  });

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, { borderColor: withOpacity(accent, 0.4) }]}>
      <Animated.View style={[styles.fill, { backgroundColor: accent }, fill]} />
      <Animated.View style={glyph}>
        <Check size={24} color={done ? color.ink : accent} strokeWidth={3} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
