import { StyleSheet, View } from 'react-native';

import type { Day } from '@/domain/calendar';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity } from '@/ui/theme';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export type NoteEntry = {
  day: Day;
  text: string;
  /** o dia ainda esta marcado: desmarcar nao apaga a nota, mas a lista diz que ficou assim */
  done: boolean;
};

export function readableDay(day: Day, today: Day): string {
  if (day === today) return 'hoje';

  const [year, month, date] = day.split('-');
  const label = `${Number(date)} de ${MONTH_NAMES[Number(month) - 1]}`;
  return year === today.slice(0, 4) ? label : `${label} de ${year}`;
}

type Props = {
  note: NoteEntry;
  today: Day;
  accent: string;
  onPress: () => void;
};

export function NoteCard({ note, today, accent, onPress }: Props) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Editar a nota de ${readableDay(note.day, today)}`}
      onPress={onPress}
      style={styles.note}>
      <View style={[styles.mark, { backgroundColor: note.done ? accent : color.inkFaint }]} />
      <View style={styles.words}>
        <View style={styles.line}>
          <Text variant="label" tone="inkMuted">
            {readableDay(note.day, today)}
          </Text>
          {note.done ? null : (
            <Text variant="caption" tone="inkFaint">
              sem marcação
            </Text>
          )}
        </View>
        <Text variant="body">{note.text}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceRaised,
    borderTopWidth: 1,
    borderTopColor: color.edge,
  },
  /* a cor do habito entra so como marca da lateral, do jeito que ela entra nos chips */
  mark: { width: space.xs, borderRadius: radius.pill, backgroundColor: withOpacity(color.ink, 0.2) },
  words: { flex: 1, gap: space.xs },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
