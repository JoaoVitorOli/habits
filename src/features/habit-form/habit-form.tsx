import * as Haptics from 'expo-haptics';
import X from 'lucide-react-native/icons/x';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { NewHabit } from '@/data/habits';
import { requestReminderPermission } from '@/data/notifications';
import { ColorPicker } from '@/features/habit-form/color-picker';
import { IconPicker } from '@/features/habit-form/icon-picker';
import { SchedulePicker } from '@/features/habit-form/schedule-picker';
import { StreakGoalPicker } from '@/features/streak-goal/streak-goal-picker';
import { HabitCard } from '@/features/home/habit-card';
import { useToday } from '@/features/use-today';
import { defaultPaletteKey, type PaletteKey } from '@/domain/palette';
import { formatTime, parseTime } from '@/domain/reminder';
import type { Schedule } from '@/domain/schedule';
import { Button } from '@/ui/button';
import { PressableScale } from '@/ui/pressable-scale';
import { Text } from '@/ui/text';
import { TextField } from '@/ui/text-field';
import { TimePickerDialog } from '@/ui/time-picker-dialog';
import { color, palette, radius, space } from '@/ui/theme';

const NO_DAYS: ReadonlySet<string> = new Set();

/** O habito e binario: a meta diaria repete o mesmo gesto, nao vira contador de quantidade. */
const MIN_TARGET = 1;
const MAX_TARGET = 10;

export type HabitFormValues = {
  name: string;
  description: string;
  icon: string;
  color: PaletteKey;
  schedule: Schedule;
  targetPerDay: number;
  streakGoal: number | null;
  reminderTime: string | null;
};

export const emptyHabitForm: HabitFormValues = {
  name: '',
  description: '',
  icon: 'lucide:dumbbell',
  color: defaultPaletteKey,
  schedule: { kind: 'daysOfWeek', days: 127 },
  targetPerDay: 1,
  streakGoal: null,
  reminderTime: null,
};

type Props = {
  title: string;
  submitLabel: string;
  initial: HabitFormValues;
  onSubmit: (habit: NewHabit) => Promise<void>;
  onClose: () => void;
  footer?: React.ReactNode;
};

export function HabitForm({ title, submitLabel, initial, onSubmit, onClose, footer }: Props) {
  const today = useToday();

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState(initial.icon);
  const [paletteKey, setPaletteKey] = useState<PaletteKey>(initial.color);
  const [schedule, setSchedule] = useState<Schedule>(initial.schedule);
  const [targetPerDay, setTargetPerDay] = useState(initial.targetPerDay);
  const [streakGoal, setStreakGoal] = useState<number | null>(initial.streakGoal);
  const [reminderTime, setReminderTime] = useState<string | null>(initial.reminderTime);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderBlocked, setReminderBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  const named = name.trim().length > 0;
  const scheduled = schedule.kind === 'timesPerWeek' || schedule.days > 0;
  const canSave = named && scheduled && !saving;

  async function save() {
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        icon,
        color: paletteKey,
        schedule,
        targetPerDay,
        streakGoal,
        reminderTime,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
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
          <Text variant="heading">{title}</Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            onPress={onClose}
            style={styles.action}>
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

          <View style={styles.group}>
            <Text variant="label" tone="inkFaint">
              Meta diária
            </Text>
            <Text variant="caption" tone="inkFaint">
              Quantas marcações o dia precisa para contar como cumprido.
            </Text>
            <View style={styles.stepper}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Menos uma marcação por dia"
                disabled={targetPerDay <= MIN_TARGET}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTargetPerDay(Math.max(MIN_TARGET, targetPerDay - 1));
                }}
                style={styles.stepButton}>
                <Text variant="heading" tone={targetPerDay <= MIN_TARGET ? 'inkDisabled' : 'ink'}>
                  −
                </Text>
              </PressableScale>

              <View style={styles.stepValue}>
                <Text variant="heading" tabular>
                  {targetPerDay}
                </Text>
                <Text variant="caption" tone="inkMuted">
                  {targetPerDay === 1 ? 'vez por dia' : 'vezes por dia'}
                </Text>
              </View>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Mais uma marcação por dia"
                disabled={targetPerDay >= MAX_TARGET}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTargetPerDay(Math.min(MAX_TARGET, targetPerDay + 1));
                }}
                style={styles.stepButton}>
                <Text variant="heading" tone={targetPerDay >= MAX_TARGET ? 'inkDisabled' : 'ink'}>
                  +
                </Text>
              </PressableScale>
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="label" tone="inkFaint">
              Meta de sequência
            </Text>
            <StreakGoalPicker
              value={streakGoal}
              unit={schedule.kind === 'timesPerWeek' ? 'semanas' : 'dias'}
              accent={palette[paletteKey]}
              onChange={setStreakGoal}
            />
          </View>

          <View style={styles.group}>
            <Text variant="label" tone="inkFaint">
              Lembrete
            </Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Escolher horário do lembrete"
              onPress={() => setReminderOpen(true)}
              style={styles.reminder}>
              <Text variant="body" tone={reminderTime === null ? 'inkMuted' : 'ink'} tabular>
                {reminderTime === null ? 'Sem lembrete' : `Todo dia agendado, às ${reminderTime}`}
              </Text>
            </PressableScale>
            {reminderBlocked ? (
              <Text variant="caption" tone="perigo">
                Sem permissão de notificação o lembrete não toca. Ative nas configurações do Android.
              </Text>
            ) : null}
          </View>

          {!scheduled ? (
            <Text variant="caption" tone="perigo">
              Escolha ao menos um dia da semana.
            </Text>
          ) : null}

          {footer}

          <TimePickerDialog
            visible={reminderOpen}
            value={parseTime(reminderTime)}
            onConfirm={async (time) => {
              setReminderOpen(false);
              setReminderTime(formatTime(time));
              // pede a permissao no momento em que ela passa a fazer sentido
              setReminderBlocked(!(await requestReminderPermission()));
            }}
            onRemove={() => {
              setReminderOpen(false);
              setReminderTime(null);
              setReminderBlocked(false);
            }}
            onClose={() => setReminderOpen(false)}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button label={submitLabel} onPress={save} disabled={!canSave} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  group: { gap: space.sm },
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
  reminder: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surfaceRaised,
  },
  action: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
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
