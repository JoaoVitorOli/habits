import Pencil from 'lucide-react-native/icons/pencil';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { duration } from '@/ui/motion';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

type Props = {
  /** o dia ja tem nota: o convite passa a ser para reler e mudar, nao para escrever do zero */
  hasNote: boolean;
  accent: string;
  onPress: () => void;
};

/**
 * Aparece embaixo do card no instante em que o dia fecha e some sozinho. E um convite, nao um
 * passo: quem so quer marcar e sair nunca precisa toca-lo.
 */
export function NoteInvite({ hasNote, accent, onPress }: Props) {
  const label = hasNote ? 'Ver a nota de hoje' : 'Anotar o que você fez';

  return (
    <Animated.View
      entering={FadeIn.duration(duration.toggle).reduceMotion(ReduceMotion.System)}
      exiting={FadeOut.duration(duration.toggle).reduceMotion(ReduceMotion.System)}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.invite, { backgroundColor: withOpacity(accent, 0.12) }]}>
        <Pencil size={16} color={accent} />
        <Text variant="label" tone="inkMuted">
          {label}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.sm,
    height: 48,
    borderRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
});
