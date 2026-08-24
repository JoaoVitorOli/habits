import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

/** Metas redondas o bastante para caber num toque; nada de teclado numerico aqui. */
const PRESETS: Record<'dias' | 'semanas', number[]> = {
  dias: [7, 21, 30, 66, 100, 365],
  semanas: [4, 8, 12, 26, 52],
};

type Props = {
  value: number | null;
  unit: 'dias' | 'semanas';
  accent: string;
  onChange: (goal: number | null) => void;
};

export function StreakGoalPicker({ value, unit, accent, onChange }: Props) {
  function choose(goal: number | null) {
    Haptics.selectionAsync();
    onChange(goal);
  }

  return (
    <View style={styles.chips}>
      <Chip label="Sem meta" selected={value === null} accent={accent} onPress={() => choose(null)} />
      {PRESETS[unit].map((goal) => (
        <Chip
          key={goal}
          label={`${goal} ${unit}`}
          selected={value === goal}
          accent={accent}
          onPress={() => choose(goal)}
        />
      ))}
    </View>
  );
}

function Chip({
  label,
  selected,
  accent,
  onPress,
}: {
  label: string;
  selected: boolean;
  accent: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected ? { backgroundColor: withOpacity(accent, 0.24), borderColor: accent } : null]}>
      <Text variant="label" tone={selected ? 'ink' : 'inkMuted'} tabular>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surfaceRaised,
  },
});
