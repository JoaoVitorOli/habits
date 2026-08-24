import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/ui/text';
import { color, space } from '@/ui/theme';
import { useBreakpoint } from '@/ui/use-breakpoint';

export default function HomeScreen() {
  const breakpoint = useBreakpoint();

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.conteudo}>
        <Text variant="title">Hábitos</Text>
        <Text variant="body" tone="inkMuted">
          Fundação pronta: tema escuro, Barlow Condensed e tokens.
        </Text>
        <Text variant="label" tone="inkFaint">
          Breakpoint {breakpoint}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: color.ground,
  },
  conteudo: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
});
