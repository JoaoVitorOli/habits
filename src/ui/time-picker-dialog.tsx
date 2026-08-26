import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { formatTime, type Time } from '@/domain/reminder';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';
import { useOverlayTransition } from '@/ui/use-overlay-transition';

const ITEM = 48;
const VISIBLE = 5;

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, step) => step * 5);

const DEFAULT_TIME: Time = { hour: 8, minute: 0 };

type Props = {
  visible: boolean;
  value: Time | null;
  onConfirm: (time: Time) => void;
  onRemove: () => void;
  onClose: () => void;
};

export function TimePickerDialog({ visible, value, onConfirm, onRemove, onClose }: Props) {
  const { mounted, progress } = useOverlayTransition(visible);
  const [time, setTime] = useState<Time>(value ?? DEFAULT_TIME);
  const [opened, setOpened] = useState(visible);

  /* o dialogo fica montado entre uma abertura e outra: sem isso ele reabriria no horario velho */
  if (visible !== opened) {
    setOpened(visible);
    if (visible) setTime(value ?? DEFAULT_TIME);
  }

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
      <View style={styles.fill}>
        {/*
          Fechar tocando fora e um irmao do card, nunca um pai dele. Como Pressable vira o
          responder no toque, o Android bloqueia a rolagem nativa de qualquer ScrollView que
          esteja embaixo — era isso que travava as rodas: o dedo arrastava e nada se movia.
        */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar" />
        <Animated.View style={[styles.backdrop, backdrop]} pointerEvents="none" />

        <View style={styles.center} pointerEvents="box-none">
          <Animated.View style={[styles.card, card]}>
            <View style={styles.words}>
              <Text variant="heading">Lembrete</Text>
              <Text variant="body" tone="inkMuted">
                Só nos dias em que o hábito está agendado.
              </Text>
            </View>

            <View style={styles.wheels}>
              <View style={styles.band} pointerEvents="none" />
              <Wheel
                label="hora"
                values={HOURS}
                value={time.hour}
                onChange={(hour) => setTime((current) => ({ ...current, hour }))}
              />
              <Text variant="heading" tone="inkMuted">
                :
              </Text>
              <Wheel
                label="minuto"
                values={MINUTES}
                value={time.minute}
                onChange={(minute) => setTime((current) => ({ ...current, minute }))}
              />
            </View>

            <View style={styles.actions}>
              <Button
                label={value === null ? 'Cancelar' : 'Remover'}
                variant="ghost"
                onPress={value === null ? onClose : onRemove}
                style={styles.action}
              />
              <Button label={formatTime(time)} onPress={() => onConfirm(time)} style={styles.action} />
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

type WheelProps = {
  label: string;
  values: number[];
  value: number;
  onChange: (value: number) => void;
};

function Wheel({ label, values, value, onChange }: WheelProps) {
  const scroller = useRef<ScrollView>(null);
  const target = Math.max(0, values.indexOf(value));

  /* dentro do Modal o layout so existe depois da montagem: alinhar no efeito chegava cedo demais */
  function align() {
    scroller.current?.scrollTo({ y: target * ITEM, animated: false });
  }

  function settle(offset: number) {
    const index = Math.round(offset / ITEM);
    const next = values[Math.min(values.length - 1, Math.max(0, index))];
    if (next === value) return;

    Haptics.selectionAsync();
    onChange(next);
  }

  return (
    <ScrollView
      ref={scroller}
      accessibilityLabel={label}
      style={styles.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM}
      decelerationRate="fast"
      contentContainerStyle={styles.wheelContent}
      onContentSizeChange={align}
      /* nada de setState por frame de rolagem: so quando o giro para. Arrastar devagar
         nao gera momento e o onMomentumScrollEnd nunca chega, entao o fim do arrasto conta. */
      onScrollEndDrag={(event) => settle(event.nativeEvent.contentOffset.y)}
      onMomentumScrollEnd={(event) => settle(event.nativeEvent.contentOffset.y)}>
      {values.map((option) => (
        <View key={option} style={styles.option}>
          <Text variant="heading" tone={option === value ? 'ink' : 'inkFaint'} tabular>
            {String(option).padStart(2, '0')}
          </Text>
        </View>
      ))}
    </ScrollView>
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
  card: {
    width: '100%',
    maxWidth: 420,
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
  wheels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM * 2,
    height: ITEM,
    borderRadius: radius.md,
    backgroundColor: withOpacity(color.accent, 0.16),
  },
  wheel: { height: ITEM * VISIBLE, width: 72 },
  wheelContent: { paddingVertical: ITEM * 2 },
  option: { height: ITEM, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  action: { flex: 1 },
});
