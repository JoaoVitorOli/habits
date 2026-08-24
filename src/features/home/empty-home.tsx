import { StyleSheet, View } from 'react-native';

import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

type Props = {
  onCreate: () => void;
};

export function EmptyHome({ onCreate }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.badge}>
        <Icon icon="lucide:sprout" size={40} color={color.accent} />
      </View>
      <View style={styles.words}>
        <Text variant="heading">Nenhum hábito ainda</Text>
        <Text variant="body" tone="inkMuted" style={styles.centered}>
          Comece por um só. O primeiro dia marcado é o que puxa o segundo.
        </Text>
      </View>
      <Button label="Criar hábito" onPress={onCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withOpacity(color.accent, 0.16),
  },
  words: { gap: space.sm, alignItems: 'center' },
  centered: { textAlign: 'center' },
});
