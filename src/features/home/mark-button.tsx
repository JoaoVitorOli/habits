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
import { Text } from '@/ui/text';
import { color, radius, withOpacity } from '@/ui/theme';

type Props = {
  /** quantas marcacoes o dia ja tem */
  count: number;
  /** quantas o dia precisa: `count >= target` e o dia completo */
  target: number;
  accent: string;
  label: string;
  onPress: () => void;
};

/** Marcar e raro e e o momento do app: aqui cabe mola, nao so um corte de cor. */
export function MarkButton({ count, target, accent, label, onPress }: Props) {
  const done = count >= target;
  // com meta de tres, o primeiro toque precisa aparecer: o botao enche pela fracao do dia
  const filled = done ? 1 : Math.min(1, Math.max(0, count / target));
  const progress = useSharedValue(filled);

  useEffect(() => {
    progress.set(
      withSpring(filled, { duration: 400, dampingRatio: 0.8, reduceMotion: ReduceMotion.System }),
    );
  }, [filled, progress]);

  const fill = useAnimatedStyle(() => ({ height: `${progress.get() * 100}%` }));
  const glyph = useAnimatedStyle(() => {
    const value = progress.get();
    return { opacity: 0.35 + 0.65 * value, transform: [{ scale: 0.85 + 0.15 * value }] };
  });

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityValue={target > 1 ? { min: 0, max: target, now: count } : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, { borderColor: withOpacity(accent, 0.4) }]}>
      <Animated.View style={[styles.fill, { backgroundColor: accent }, fill]} />
      <Animated.View style={glyph}>
        {/* enquanto falta marcacao, o numero e a unica coisa que diz onde o dia esta */}
        {target > 1 && !done ? (
          <Text variant="label" tone="ink" tabular>
            {count}/{target}
          </Text>
        ) : (
          <Check size={24} color={done ? color.ink : accent} strokeWidth={3} />
        )}
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
  /* enche de baixo para cima: o dia sobe, nao aparece inteiro de uma vez */
  fill: { position: 'absolute', right: 0, bottom: 0, left: 0 },
});
