import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import type { Day } from '@/domain/calendar';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { color, radius, space } from '@/ui/theme';
import { useOverlayTransition } from '@/ui/use-overlay-transition';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function readableDay(day: Day): string {
  const [, month, date] = day.split('-');
  return `${Number(date)} de ${MONTH_NAMES[Number(month) - 1]}`;
}

type Props = {
  day: Day | null;
  initialText: string;
  onSave: (text: string) => void;
  onClose: () => void;
};

export function DayNoteDialog({ day, initialText, onSave, onClose }: Props) {
  const { mounted, progress } = useOverlayTransition(day !== null);
  const [text, setText] = useState(initialText);

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

        <KeyboardAvoidingView
          style={styles.center}
          pointerEvents="box-none"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={() => undefined} style={styles.wrapper}>
            <Animated.View style={[styles.card, card]}>
              <View style={styles.words}>
                <Text variant="heading">Nota de {day === null ? '' : readableDay(day)}</Text>
                <Text variant="body" tone="inkMuted">
                  O que aconteceu nesse dia. Apagar o texto remove a nota.
                </Text>
              </View>

              <TextField
                label="Nota"
                value={text}
                onChangeText={setText}
                placeholder="Foi puxado, mas fui"
                maxLength={500}
                multiline
                autoFocus
              />

              <View style={styles.actions}>
                <Button label="Cancelar" variant="ghost" onPress={onClose} style={styles.action} />
                <Button label="Salvar nota" onPress={() => onSave(text)} style={styles.action} />
              </View>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
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
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
});
