import { useRouter } from 'expo-router';

import { createHabit } from '@/data/habits';
import { emptyHabitForm, HabitForm } from '@/features/habit-form/habit-form';

export function NewHabitScreen() {
  const router = useRouter();

  return (
    <HabitForm
      title="Novo hábito"
      submitLabel="Salvar hábito"
      initial={emptyHabitForm}
      onSubmit={(habit) => createHabit(habit, new Date()).then(() => undefined)}
      onClose={() => router.back()}
    />
  );
}
