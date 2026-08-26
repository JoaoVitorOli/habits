import { StyleSheet, View } from 'react-native';

import type { PaletteKey } from '@/domain/palette';
import type { Schedule } from '@/domain/schedule';
import { streakUnit } from '@/domain/streak';
import { MarkButton } from '@/features/home/mark-button';
import { streakLabel } from '@/features/streak-label';
import { Icon, type IconRef } from '@/ui/icon';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';

export type CompactRowModel = {
  name: string;
  icon: IconRef;
  color: PaletteKey;
  schedule: Schedule;
  currentStreak: number;
  todayCount: number;
  targetPerDay: number;
};

type Props = {
  habit: CompactRowModel;
  onToggleToday: () => void;
};

/**
 * O mesmo hábito do card, sem o grid: quem tem quinze hábitos quer ver os quinze de uma vez,
 * e o histórico continua a um toque de distância na tela de detalhe.
 */
export function CompactRow({ habit, onToggleToday }: Props) {
  const accent = palette[habit.color];
  const doneToday = habit.todayCount >= habit.targetPerDay;

  return (
    <View style={styles.row}>
      <View style={[styles.iconSquare, { backgroundColor: withOpacity(accent, 0.16) }]}>
        <Icon icon={habit.icon} size={22} color={accent} />
      </View>
      <View style={styles.identity}>
        <Text variant="heading" numberOfLines={1}>
          {habit.name}
        </Text>
        <Text variant="caption" tone="inkMuted" tabular>
          {streakLabel(habit.currentStreak, streakUnit(habit.schedule))}
        </Text>
      </View>
      <MarkButton
        count={habit.todayCount}
        target={habit.targetPerDay}
        accent={accent}
        label={doneToday ? `Desmarcar ${habit.name} hoje` : `Marcar ${habit.name} hoje`}
        onPress={onToggleToday}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    paddingLeft: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
  iconSquare: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  identity: { flex: 1, gap: space.xs },
});
