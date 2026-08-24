import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/ui/text';
import { color, fontFamily, radius, space } from '@/ui/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
};

export function TextField({ label, value, onChangeText, placeholder, multiline, maxLength, autoFocus }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.group}>
      <Text variant="label" tone={focused ? 'accent' : 'inkFaint'}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.inkFaint}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, multiline ? styles.multiline : null, focused ? styles.focused : null]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  input: {
    minHeight: 48,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    color: color.ink,
    fontFamily: fontFamily.regular,
    fontSize: 18,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  focused: { borderColor: color.accent },
});
