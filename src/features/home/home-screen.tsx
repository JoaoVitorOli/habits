import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activeHabitsQuery } from '@/data/habits';
import { HabitCard } from '@/features/home/habit-card';
import { EmptyHome } from '@/features/home/empty-home';
import { useToday } from '@/features/use-today';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, radius, space, withOpacity, type PaletteKey } from '@/ui/theme';
import { useBreakpoint, type Breakpoint } from '@/ui/use-breakpoint';

/** Tablet ganha coluna, nao ganha tamanho. */
const columns: Record<Breakpoint, number> = { compact: 1, medium: 2, expanded: 3 };

const NO_DAYS: ReadonlySet<string> = new Set();

export function HomeScreen() {
  const router = useRouter();
  const today = useToday();
  const breakpoint = useBreakpoint();
  const { data: habits } = useLiveQuery(activeHabitsQuery);

  const total = columns[breakpoint];
  const openForm = () => router.push('/habito/novo');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="title">Hábitos</Text>
      </View>

      {habits.length === 0 ? (
        <EmptyHome onCreate={openForm} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.columns}>
            {habits.map((habit) => (
              <View key={habit.id} style={[styles.column, { width: `${100 / total}%` }]}>
                <HabitCard
                  today={today}
                  habit={{
                    name: habit.name,
                    icon: habit.icon,
                    color: habit.color as PaletteKey,
                    currentStreak: 0,
                    completedDays: NO_DAYS,
                  }}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Criar hábito"
        onPress={openForm}
        style={styles.fab}>
        <Plus size={28} color={color.ink} />
      </PressableScale>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md },
  list: { paddingHorizontal: space.md, paddingBottom: space['3xl'] },
  columns: { flexDirection: 'row', flexWrap: 'wrap' },
  column: { padding: space.sm },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.lg,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.accent,
    shadowColor: withOpacity(color.accent, 1),
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
