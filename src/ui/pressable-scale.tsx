import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration, EASE_OUT } from '@/ui/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Feedback na descida do dedo, commit na subida. Com movimento reduzido a escala sai e
 * sobra a opacidade — menos e mais suave, nunca nada.
 */
export function PressableScale({ style, disabled, children, ...rest }: Props) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();

  const animated = useAnimatedStyle(() => {
    const value = pressed.get();
    return reduced
      ? { opacity: 1 - 0.15 * value }
      : { transform: [{ scale: 1 - 0.03 * value }] };
  });

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
      {children}
    </AnimatedPressable>
  );
}
