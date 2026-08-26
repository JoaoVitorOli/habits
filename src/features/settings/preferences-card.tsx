import * as Haptics from 'expo-haptics';
import { StyleSheet, View } from 'react-native';

import { savePreferences, usePreferences } from '@/data/settings';
import { hourLabel, wrapHour } from '@/domain/preferences';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';

const WEEK_START_LABELS = ['Domingo', 'Segunda'];

/**
 * As duas preferencias que mexem em todo calculo de calendario. Mudar aqui e barato: a home,
 * o detalhe, a visao geral e o widget leem a mesma linha e se redesenham sozinhos.
 */
export function PreferencesCard() {
  const { dayStartHour, weekStartsOn } = usePreferences();

  function change(patch: Parameters<typeof savePreferences>[0]) {
    Haptics.selectionAsync();
    savePreferences(patch, new Date());
  }

  return (
    <>
      <View style={styles.block}>
        <Text variant="label" tone="inkFaint">
          Virada do dia
        </Text>
        <Text variant="caption" tone="inkFaint">
          Uma marcação antes desse horário conta para o dia anterior — a madrugada ainda é ontem.
        </Text>

        <View style={styles.stepper}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Uma hora mais cedo"
            onPress={() => change({ dayStartHour: wrapHour(dayStartHour - 1) })}
            style={styles.stepButton}>
            <Text variant="heading">−</Text>
          </PressableScale>

          <View style={styles.stepValue}>
            <Text variant="heading" tabular>
              {hourLabel(dayStartHour)}
            </Text>
            <Text variant="caption" tone="inkMuted">
              hora local
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Uma hora mais tarde"
            onPress={() => change({ dayStartHour: wrapHour(dayStartHour + 1) })}
            style={styles.stepButton}>
            <Text variant="heading">+</Text>
          </PressableScale>
        </View>
      </View>

      <View style={styles.block}>
        <Text variant="label" tone="inkFaint">
          Primeiro dia da semana
        </Text>
        <View style={styles.segmented}>
          {WEEK_START_LABELS.map((label, day) => {
            const selected = weekStartsOn === day;

            return (
              <PressableScale
                key={label}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                onPress={() => {
                  // reencostar no que ja esta escolhido nao e uma troca
                  if (selected) return;
                  change({ weekStartsOn: day });
                }}
                style={[styles.segment, selected ? styles.segmentOn : null]}>
                <Text variant="label" tone={selected ? 'ink' : 'inkMuted'}>
                  {label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.md,
    padding: space.sm,
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceOverlay,
  },
  stepValue: { flex: 1, alignItems: 'center' },
  segmented: {
    flexDirection: 'row',
    gap: space.xs,
    backgroundColor: color.surfaceRaised,
    borderRadius: radius.pill,
    padding: space.xs,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  segmentOn: { backgroundColor: color.accent },
});
