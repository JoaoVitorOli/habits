import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'perigo';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: Props) {
  const inert = disabled || loading;
  const variantStyle = { primary: styles.primary, ghost: styles.ghost, perigo: styles.perigo };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inert) }}
      disabled={inert}
      onPress={onPress}
      style={[
        styles.base,
        variantStyle[variant],
        disabled ? styles.disabled : null,
        style ?? null,
      ]}>
      {/* o rotulo e o spinner ocupam o mesmo lugar: o botao nunca muda de largura */}
      <Text variant="label" tone={disabled ? 'inkDisabled' : 'ink'} style={loading ? styles.hidden : null}>
        {label}
      </Text>
      {loading ? (
        <View style={styles.spinner}>
          <ActivityIndicator color={color.ink} />
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: color.accent },
  perigo: { backgroundColor: color.perigo },
  ghost: { backgroundColor: color.surfaceRaised, borderWidth: 1, borderColor: color.line },
  disabled: { backgroundColor: color.surfaceRaised, opacity: 0.6 },
  hidden: { opacity: 0 },
  spinner: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
});
