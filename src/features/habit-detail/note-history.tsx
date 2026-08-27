import { StyleSheet, View } from 'react-native';

import type { Day } from '@/domain/calendar';
import { NoteCard, type NoteEntry } from '@/features/day-note/note-card';
import { Button } from '@/ui/button';
import { Text } from '@/ui/text';
import { space } from '@/ui/theme';

/** Quantas cabem aqui antes da lista virar a tela dela. */
const PREVIEW = 3;

type Props = {
  /** ja na ordem em que se rele um diario: do dia mais novo para o mais velho */
  notes: NoteEntry[];
  today: Day;
  accent: string;
  onOpen: (day: Day) => void;
  onSeeAll: () => void;
};

/**
 * As ultimas notas, para o mes recente se ler de relance. O resto — e editar, remover e
 * preencher um dia esquecido — mora na tela de notas.
 */
export function NoteHistory({ notes, today, accent, onOpen, onSeeAll }: Props) {
  return (
    <View style={styles.block}>
      <Text variant="label" tone="inkFaint">
        Notas
      </Text>

      {notes.length === 0 ? (
        <Text variant="caption" tone="inkFaint">
          Nenhuma nota ainda. A primeira que você escrever aparece aqui.
        </Text>
      ) : (
        notes
          .slice(0, PREVIEW)
          .map((note) => (
            <NoteCard
              key={note.day}
              note={note}
              today={today}
              accent={accent}
              onPress={() => onOpen(note.day)}
            />
          ))
      )}

      {notes.length > PREVIEW ? (
        <Button label={`Ver todas as ${notes.length} notas`} variant="ghost" onPress={onSeeAll} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm },
});
