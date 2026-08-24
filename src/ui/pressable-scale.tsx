import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, EASE_OUT } from '@/ui/motion';
import { color } from '@/ui/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** desliga o brilho onde ele cairia num retangulo que nao e o desenho do alvo */
  dim?: boolean;
};

/**
 * Feedback na descida do dedo, commit na subida. Com movimento reduzido a escala sai e
 * sobra a opacidade — menos e mais suave, nunca nada.
 */
export function PressableScale({ style, disabled, dim = true, children, ...rest }: Props) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();
  const shape = StyleSheet.flatten(style);

  const animated = useAnimatedStyle(() => {
    const value = pressed.get();
    return reduced
      ? { opacity: 1 - 0.15 * value }
      : { transform: [{ scale: 1 - 0.03 * value }] };
  });

  const tint = useAnimatedStyle(() => ({ opacity: pressed.get() }));

  const timing = { duration: duration.press, easing: EASE_OUT, reduceMotion: ReduceMotion.System };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      hitSlop={8}
      pressRetentionOffset={16}
      onPressIn={(event) => {
        pressed.set(withTiming(1, timing));
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.set(withTiming(0, timing));
        rest.onPressOut?.(event);
      }}
      style={[style ?? null, animated]}>
      {dim && !disabled ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tint,
            { borderRadius: shape?.borderRadius ?? 0, backgroundColor: color.pressTint },
            tint,
          ]}
        />
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
