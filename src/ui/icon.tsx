import { Text as RNText, StyleSheet } from 'react-native';

import { lucideIcons } from '@/ui/icons';

/** `lucide:dumbbell` ou `emoji:📚`. O banco guarda essa string. */
export type IconRef = string;

export function iconKind(icon: IconRef): 'lucide' | 'emoji' {
  return icon.startsWith('emoji:') ? 'emoji' : 'lucide';
}

export function iconValue(icon: IconRef): string {
  return icon.slice(icon.indexOf(':') + 1);
}

type Props = {
  icon: IconRef;
  size: number;
  color: string;
};

export function Icon({ icon, size, color }: Props) {
  const value = iconValue(icon);

  if (iconKind(icon) === 'emoji') {
    return <RNText style={[styles.emoji, { fontSize: size, lineHeight: size * 1.2 }]}>{value}</RNText>;
  }

  const Glyph = lucideIcons[value];
  if (!Glyph) return null;

  return <Glyph size={size} color={color} strokeWidth={2} />;
}

const styles = StyleSheet.create({
  emoji: { textAlign: 'center' },
});
