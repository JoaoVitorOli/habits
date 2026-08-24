import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import X from 'lucide-react-native/icons/x';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createHabit } from '@/data/habits';
import { ColorPicker } from '@/features/habit-form/color-picker';
import { IconPicker } from '@/features/habit-form/icon-picker';
import { SchedulePicker } from '@/features/habit-form/schedule-picker';
import { HabitCard } from '@/features/home/habit-card';
import { useToday } from '@/features/use-today';
import { defaultPaletteKey, type PaletteKey } from '@/domain/palette';
import type { Schedule } from '@/domain/schedule';
import { Button } from '@/ui/button';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { color, space } from '@/ui/theme';

const NO_DAYS: ReadonlySet<string> = new Set();

export function HabitFormScreen() {
  const router = useRouter();
  const today = useToday();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('lucide:dumbbell');
  const [paletteKey, setPaletteKey] = useState<PaletteKey>(defaultPaletteKey);
  const [schedule, setSchedule] = useState<Schedule>({ kind: 'daysOfWeek', days: 127 });
  const [saving, setSaving] = useState(false);

  const named = name.trim().length > 0;
  const scheduled = schedule.kind === 'timesPerWeek' || schedule.days > 0;
  const canSave = named && scheduled && !saving;

  async function save() {
    setSaving(true);
    try {
      await createHabit(
        {
          name: name.trim(),
          description: description.trim() || null,
          icon,
          color: paletteKey,
          schedule,
          targetPerDay: 1,
        },
        new Date(),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text variant="heading">Novo hábito</Text>
          <PressableScale accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => router.back()}>
            <X size={24} color={color.inkMuted} />
          </PressableScale>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <HabitCard
            today={today}
            habit={{
              name: name.trim() || 'Seu hábito',
              icon,
              color: paletteKey,
              schedule,
              currentStreak: 0,
              completedDays: NO_DAYS,
            }}
          />

          <TextField label="Nome" value={name} onChangeText={setName} placeholder="Treino" maxLength={60} autoFocus />
          <TextField
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Opcional"
            maxLength={200}
            multiline
          />
          <IconPicker value={icon} accent={paletteKey} onChange={setIcon} />
          <ColorPicker value={paletteKey} onChange={setPaletteKey} />
          <SchedulePicker value={schedule} onChange={setSchedule} />

          {!scheduled ? (
            <Text variant="caption" tone="perigo">
              Escolha ao menos um dia da semana.
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Salvar hábito" onPress={save} disabled={!canSave} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  form: { padding: space.lg, paddingTop: space.sm, gap: space.lg, paddingBottom: space['2xl'] },
  footer: {
    padding: space.lg,
    borderTopWidth: 1,
    borderTopColor: color.line,
    backgroundColor: color.surface,
  },
});
