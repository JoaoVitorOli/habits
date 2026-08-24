import { Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';
import { useOverlayTransition } from '@/ui/use-overlay-transition';

export type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  tone?: 'ink' | 'perigo';
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  /** distancia do topo, para o menu nascer colado no botao que o abriu */
  top: number;
};

export function Menu({ visible, onClose, items, top }: Props) {
  const { mounted, progress } = useOverlayTransition(visible);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() * 0.6 }));

  const sheet = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      opacity: value,
      // nada surge do nada: comeca em 0.96, e translada antes de escalar
      transform: [{ translateY: -space.sm * (1 - value) }, { scale: 0.96 + 0.04 * value }],
    };
  });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Fechar menu">
        <Animated.View style={[styles.fill, styles.backdrop, backdrop]} pointerEvents="none" />

        <Animated.View style={[styles.sheet, { top }, sheet]}>
          {items.map((item, index) => (
            <PressableScale
              key={item.label}
              accessibilityRole="menuitem"
              accessibilityLabel={item.label}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={[styles.item, index > 0 ? styles.divided : null]}>
              {item.icon}
              <Text variant="body" tone={item.tone === 'perigo' ? 'perigo' : 'ink'}>
                {item.label}
              </Text>
            </PressableScale>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.ground },
  sheet: {
    position: 'absolute',
    right: space.md,
    minWidth: 200,
    backgroundColor: color.surfaceOverlay,
    borderRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: color.edge,
    paddingVertical: space.xs,
    shadowColor: color.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 48,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
  },
  divided: { borderTopWidth: 1, borderTopColor: color.line },
});
