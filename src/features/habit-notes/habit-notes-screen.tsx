import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completionsOfHabit } from '@/data/completions';
import { habitByIdQuery } from '@/data/habits';
import { notesOfHabit, removeNote, saveNote } from '@/data/notes';
import { monthOf, type Day, type Month } from '@/domain/calendar';
import { paletteKeyOf } from '@/domain/palette';
import { DayNoteDialog } from '@/features/day-note/day-note-dialog';
import { NoteCard, type NoteEntry } from '@/features/day-note/note-card';
import { DayPickerDialog } from '@/features/habit-notes/day-picker-dialog';
import { useToday } from '@/features/use-today';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function monthLabel(month: Month): string {
  const [year, index] = month.split('-').map(Number);
  return `${MONTH_NAMES[index - 1]} de ${year}`;
}

type MonthGroup = { month: Month; notes: NoteEntry[] };

/** Um cabecalho de mes por vez, na mesma ordem da lista: do mais novo para o mais velho. */
function groupByMonth(notes: NoteEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];

  for (const note of notes) {
    const month = monthOf(note.day);
    const last = groups.at(-1);

    if (last?.month === month) last.notes.push(note);
    else groups.push({ month, notes: [note] });
  }

  return groups;
}

export function HabitNotesScreen({ id }: { id: string }) {
  const router = useRouter();
  const today = useToday();
  const [noteDay, setNoteDay] = useState<Day | null>(null);
  const [picking, setPicking] = useState(false);
  const [month, setMonth] = useState(() => monthOf(today));

  const { data: found } = useLiveQuery(habitByIdQuery(id), [id]);
  const { data: completions } = useLiveQuery(completionsOfHabit(id), [id]);
  const { data: notes } = useLiveQuery(notesOfHabit(id), [id]);
  const habit = found.at(0);

  const completedDays = useMemo(() => {
    const days = new Set<Day>();
    const target = habit?.targetPerDay ?? 1;
    for (const completion of completions) {
      if (completion.count >= target) days.add(completion.day);
    }
    return days;
  }, [completions, habit?.targetPerDay]);

  const notesByDay = useMemo(() => {
    const byDay = new Map<Day, string>();
    for (const note of notes) byDay.set(note.day, note.text);
    return byDay;
  }, [notes]);

  const noteDays = useMemo(() => new Set(notesByDay.keys()), [notesByDay]);

  const groups = useMemo(
    () =>
      groupByMonth(
        [...notes]
          .sort((left, right) => right.day.localeCompare(left.day))
          .map((note) => ({ day: note.day, text: note.text, done: completedDays.has(note.day) })),
      ),
    [notes, completedDays],
  );

  if (!habit) return <View style={styles.screen} />;

  const accent = palette[paletteKeyOf(habit.color)];

  function openPicker() {
    setMonth(monthOf(today));
    setPicking(true);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.action}>
          <ChevronLeft size={28} color={color.inkMuted} />
        </PressableScale>
        <View style={[styles.iconSquare, { backgroundColor: withOpacity(accent, 0.16) }]}>
          <Icon icon={habit.icon} size={24} color={accent} />
        </View>
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          Notas
        </Text>
      </View>

      <DayPickerDialog
        visible={picking}
        month={month}
        onMonthChange={setMonth}
        today={today}
        completedDays={completedDays}
        noteDays={noteDays}
        accent={accent}
        onPick={(day) => {
          setPicking(false);
          setNoteDay(day);
        }}
        onClose={() => setPicking(false)}
      />

      <DayNoteDialog
        key={noteDay ?? 'sem-dia'}
        day={noteDay}
        initialText={noteDay === null ? '' : (notesByDay.get(noteDay) ?? '')}
        onSave={(text) => {
          if (noteDay !== null) saveNote(habit.id, noteDay, text, new Date());
          setNoteDay(null);
        }}
        onRemove={
          noteDay !== null && notesByDay.has(noteDay)
            ? () => {
                removeNote(habit.id, noteDay, new Date());
                setNoteDay(null);
              }
            : undefined
        }
        onClose={() => setNoteDay(null)}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="label" tone="inkFaint">
          {habit.name}
        </Text>

        {groups.length === 0 ? (
          <Text variant="body" tone="inkMuted">
            Nenhuma nota ainda. Escreva a primeira: dá para escolher qualquer dia que você já
            marcou como feito.
          </Text>
        ) : (
          groups.map((group) => (
            <View key={group.month} style={styles.group}>
              <Text variant="label" tone="inkFaint">
                {monthLabel(group.month)}
              </Text>
              {group.notes.map((note) => (
                <NoteCard
                  key={note.day}
                  note={note}
                  today={today}
                  accent={accent}
                  onPress={() => setNoteDay(note.day)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Escrever nota" onPress={openPicker} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  iconSquare: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  action: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space['2xl'] },
  group: { gap: space.sm },
  footer: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md },
});
