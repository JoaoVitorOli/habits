import * as Haptics from 'expo-haptics';
import Check from 'lucide-react-native/icons/check';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

const THUMB = 56;
const COMMIT = 0.7;

type Props = {
  done: boolean;
  accent: string;
  onCommit: () => void;
};

/** O gesto tem dedo, entao a volta usa mola com a velocidade do arrasto. */
export function DragToComplete({ done, accent, onCommit }: Props) {
  const [width, setWidth] = useState(0);
  const offset = useSharedValue(0);
  const travel = Math.max(0, width - THUMB - space.xs * 2);

  useEffect(() => {
    offset.set(0);
  }, [done, offset]);

  function commit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCommit();
  }

  /* o arraste avisa no dedo quando ja deu: soltar aqui completa */
  useAnimatedReaction(
    () => travel > 0 && offset.get() >= travel * COMMIT,
    (reached, previous) => {
      if (previous !== null && reached !== previous && reached) {
        scheduleOnRN(Haptics.selectionAsync);
      }
    },
  );

  const pan = Gesture.Pan()
    .enabled(travel > 0)
    .onUpdate((event) => {
      offset.set(Math.min(travel, Math.max(0, event.translationX)));
    })
    .onEnd((event) => {
      const reached = offset.get() >= travel * COMMIT;
      if (reached) scheduleOnRN(commit);
      offset.set(
        withSpring(0, {
          duration: 400,
          dampingRatio: 0.8,
          velocity: event.velocityX,
          reduceMotion: ReduceMotion.System,
        }),
      );
    });

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  const trail = useAnimatedStyle(() => ({
    opacity: travel === 0 ? 0 : Math.min(1, offset.get() / (travel * COMMIT)),
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[styles.track, { borderColor: withOpacity(accent, 0.35) }]}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        <Animated.View style={[styles.trail, { backgroundColor: withOpacity(accent, 0.18) }, trail]} />

        <Text variant="label" tone={done ? 'inkMuted' : 'ink'} style={styles.label}>
          {done ? 'Arraste para desfazer' : 'Arraste para completar'}
        </Text>

        <Animated.View style={[styles.thumb, { backgroundColor: accent }, thumb]}>
          {done ? <Check size={24} color={color.ink} strokeWidth={3} /> : <ChevronRight size={24} color={color.ink} />}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    height: THUMB + space.xs * 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: color.surfaceRaised,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trail: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  label: { textAlign: 'center' },
  thumb: {
    position: 'absolute',
    left: space.xs,
    width: THUMB,
    height: THUMB,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
