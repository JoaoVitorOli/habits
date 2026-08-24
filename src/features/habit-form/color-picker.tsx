import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { paletteKeys, type PaletteKey } from '@/domain/palette';
import { color, palette, radius, space } from '@/ui/theme';

type Props = {
  value: PaletteKey;
  onChange: (value: PaletteKey) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <View style={styles.group}>
      <Text variant="label" tone="inkFaint">
        Cor
      </Text>
      <View style={styles.swatches}>
        {paletteKeys.map((key) => (
          <PressableScale
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ selected: key === value }}
            accessibilityLabel={key}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(key);
            }}
            /* o anel de selecao aqui e claro, nao violeta: violeta sobre a amostra violeta some */
            style={[styles.swatch, key === value ? styles.selected : null]}>
            <View style={[styles.fill, { backgroundColor: palette[key] }]} />
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: color.ink },
  fill: { width: 32, height: 32, borderRadius: radius.pill },
});
