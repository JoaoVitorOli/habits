import {
  BarlowCondensed_400Regular,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  useFonts,
} from '@expo-google-fonts/barlow-condensed';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';

import { db } from '@/data/db';
import { activeHabitsQuery } from '@/data/habits';
import migrations from '@/data/migrations/migrations';
import type { HabitRow } from '@/data/schema';
import { readPreferences } from '@/data/settings';
import { saveWidgetSnapshot, setWidgetHabit } from '@/data/widget';
import { paletteKeyOf } from '@/domain/palette';
import { habitOf } from '@/domain/widget-snapshot';
import { logicalDay } from '@/domain/calendar';
import { Button } from '@/ui/button';
import { Icon } from '@/ui/icon';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { color, palette, radius, space, withOpacity } from '@/ui/theme';
import { HabitWidget } from '@/widget/habit-widget';

/**
 * Activity propria, aberta pelo Android quando o widget entra na tela inicial. E uma raiz
 * React separada da do app: as fontes e as migrations precisam ser garantidas de novo aqui.
 */
export function WidgetConfigurationScreen({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const [fontesCarregadas, erroDeFonte] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  const { success: bancoPronto } = useMigrations(db, migrations);
  const { data: habits } = useLiveQuery(activeHabitsQuery);

  async function choose(habit: HabitRow) {
    const now = new Date();
    const preferences = await readPreferences();
    const today = logicalDay(now, preferences.dayStartHour);

    await setWidgetHabit(widgetInfo.widgetId, habit.id);
    const snapshot = await saveWidgetSnapshot(today, preferences, now);

    renderWidget(
      <HabitWidget
        habit={habitOf(snapshot, habit.id)}
        today={today}
        weekStartsOn={preferences.weekStartsOn}
        box={widgetInfo}
      />,
    );
    setResult('ok');
  }

  if (!(fontesCarregadas || erroDeFonte) || !bancoPronto) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <Text variant="title" style={styles.title}>
        Qual hábito?
      </Text>

      {habits.length === 0 ? (
        <Text variant="body" tone="inkMuted" style={styles.empty}>
          Crie um hábito no app e volte para adicionar o widget.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {habits.map((habit) => {
            const accent = palette[paletteKeyOf(habit.color)];

            return (
              <PressableScale
                key={habit.id}
                accessibilityRole="button"
                accessibilityLabel={`Widget de ${habit.name}`}
                style={styles.row}
                onPress={() => choose(habit)}>
                <View style={[styles.iconSquare, { backgroundColor: withOpacity(accent, 0.16) }]}>
                  <Icon icon={habit.icon} size={24} color={accent} />
                </View>
                <Text variant="heading" numberOfLines={1} style={styles.name}>
                  {habit.name}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      )}

      <Button label="Cancelar" variant="ghost" onPress={() => setResult('cancel')} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground, padding: space.lg, gap: space.md },
  title: { paddingTop: space.xl },
  empty: { flex: 1 },
  list: { gap: space.sm, paddingBottom: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: color.surface,
  },
  iconSquare: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1 },
});
