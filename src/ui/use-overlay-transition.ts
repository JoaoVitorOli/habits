import { useEffect, useState } from 'react';
import {
  ReduceMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { duration, EASE_OUT } from '@/ui/motion';

/**
 * O Modal do React Native desmonta o conteudo no instante em que `visible` vira false,
 * o que mataria a animacao de saida. Este hook segura a montagem ate o progresso chegar a zero.
 */
export function useOverlayTransition(visible: boolean): { mounted: boolean; progress: SharedValue<number> } {
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return;

    progress.set(
      withTiming(
        visible ? 1 : 0,
        {
          duration: visible ? duration.toggle : duration.press,
          easing: EASE_OUT,
          reduceMotion: ReduceMotion.System,
        },
        (finished) => {
          if (finished && !visible) scheduleOnRN(setMounted, false);
        },
      ),
    );
  }, [visible, mounted, progress]);

  return { mounted, progress };
}
