import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { Day, Month } from '@/domain/calendar';
import { MonthCalendar } from '@/features/habit-detail/month-calendar';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';
import { useOverlayTransition } from '@/ui/use-overlay-transition';

type Props = {
  visible: boolean;
  month: Month;
  onMonthChange: (month: Month) => void;
  today: Day;
  completedDays: ReadonlySet<Day>;
  noteDays: ReadonlySet<Day>;
  accent: string;
  onPick: (day: Day) => void;
  onClose: () => void;
};

/**
 * O mesmo calendario da tela do habito, em modo de escolha: o dia que voce marcou responde ao
 * toque, o resto fica inerte. E assim que a regra "so existe nota em dia feito" se ve.
 */
export function DayPickerDialog({
  visible,
  month,
  onMonthChange,
  today,
  completedDays,
  noteDays,
  accent,
  onPick,
  onClose,
}: Props) {
  const { mounted, progress } = useOverlayTransition(visible);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() * 0.7 }));

  const card = useAnimatedStyle(() => {
    const current = progress.get();
    return {
      opacity: current,
      transform: [{ translateY: space.md * (1 - current) }, { scale: 0.96 + 0.04 * current }],
    };
  });

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Fechar">
        <Animated.View style={[styles.backdrop, backdrop]} pointerEvents="none" />

        <View style={styles.center} pointerEvents="box-none">
          <Pressable onPress={() => undefined} style={styles.wrapper}>
            <Animated.View style={[styles.card, card]}>
              <View style={styles.words}>
                <Text variant="heading">Que dia?</Text>
                <Text variant="body" tone="inkMuted">
                  Só os dias que você marcou aceitam nota.
                </Text>
              </View>

              <MonthCalendar
                month={month}
                onMonthChange={onMonthChange}
                today={today}
                completedDays={completedDays}
                accent={accent}
                noteDays={noteDays}
                mode="escolher"
                onOpenNote={onPick}
              />

              <Button label="Cancelar" variant="ghost" onPress={onClose} />
            </Animated.View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: color.ground },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  wrapper: { width: '100%', maxWidth: 420 },
  card: {
    backgroundColor: color.surfaceOverlay,
    borderRadius: radius.xl,
    borderTopWidth: 1,
    borderTopColor: color.edge,
    padding: space.lg,
    gap: space.lg,
    shadowColor: color.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 24,
  },
  words: { gap: space.sm },
});
