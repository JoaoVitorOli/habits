import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toggleWeekday, weekdayBit, type Schedule } from '@/domain/schedule';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space } from '@/ui/theme';

const ALL_WEEK = 127;

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

type Props = {
  value: Schedule;
  onChange: (value: Schedule) => void;
};

export function SchedulePicker({ value, onChange }: Props) {
  /* trocar de modo e voltar nao pode apagar o que ja foi escolhido no outro */
  const [lastDays, setLastDays] = useState(value.kind === 'daysOfWeek' ? value.days : ALL_WEEK);
  const [lastTimes, setLastTimes] = useState(value.kind === 'timesPerWeek' ? value.times : 3);

  function changeDays(days: number) {
    setLastDays(days);
    onChange({ kind: 'daysOfWeek', days });
  }

  function changeTimes(times: number) {
    setLastTimes(times);
    onChange({ kind: 'timesPerWeek', times });
  }

  return (
    <View style={styles.group}>
      <Text variant="label" tone="inkFaint">
        Agenda
      </Text>

      <View style={styles.segmented}>
        <Segment
          label="Dias da semana"
          selected={value.kind === 'daysOfWeek'}
          onPress={() => changeDays(lastDays)}
        />
        <Segment
          label="Vezes por semana"
          selected={value.kind === 'timesPerWeek'}
          onPress={() => changeTimes(lastTimes)}
        />
      </View>

      {value.kind === 'daysOfWeek' ? (
        <View style={styles.weekdays}>
          {WEEKDAY_INITIALS.map((initial, weekday) => {
            const on = (value.days & weekdayBit(weekday)) !== 0;
            return (
              <PressableScale
                key={WEEKDAY_NAMES[weekday]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={WEEKDAY_NAMES[weekday]}
                onPress={() => {
                  Haptics.selectionAsync();
                  changeDays(toggleWeekday(value.days, weekday));
                }}
                style={[styles.weekday, on ? styles.weekdayOn : null]}>
                <Text variant="label" tone={on ? 'ink' : 'inkMuted'}>
                  {initial}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      ) : (
        <View style={styles.stepper}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Menos uma vez por semana"
            disabled={value.times <= 1}
            onPress={() => {
              Haptics.selectionAsync();
              changeTimes(Math.max(1, value.times - 1));
            }}
            style={styles.stepButton}>
            <Text variant="heading" tone={value.times <= 1 ? 'inkDisabled' : 'ink'}>
              −
            </Text>
          </PressableScale>

          <View style={styles.stepValue}>
            <Text variant="heading" tabular>
              {value.times}
            </Text>
            <Text variant="caption" tone="inkMuted">
              {value.times === 1 ? 'vez por semana' : 'vezes por semana'}
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Mais uma vez por semana"
            disabled={value.times >= 7}
            onPress={() => {
              Haptics.selectionAsync();
              changeTimes(Math.min(7, value.times + 1));
            }}
            style={styles.stepButton}>
            <Text variant="heading" tone={value.times >= 7 ? 'inkDisabled' : 'ink'}>
              +
            </Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

function Segment({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        // reencostar no segmento ativo nao e uma troca: nao mexe no que ja foi escolhido
        if (selected) return;
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.segment, selected ? styles.segmentOn : null]}>
      <Text variant="label" tone={selected ? 'ink' : 'inkMuted'} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
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
  weekdays: { flexDirection: 'row', gap: space.xs },
  weekday: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surfaceRaised,
    borderWidth: 1,
    borderColor: color.line,
  },
  weekdayOn: { backgroundColor: color.accent, borderColor: color.accent },
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
});
