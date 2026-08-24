import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { deleteHabit, habitByIdQuery, scheduleOf, updateHabit } from '@/data/habits';
import { HabitForm } from '@/features/habit-form/habit-form';
import { paletteKeyOf } from '@/domain/palette';
import { Button } from '@/ui/button';
import { ConfirmDialog } from '@/ui/confirm-dialog';
import { Text } from '@/ui/text';
import { color, space } from '@/ui/theme';

export function EditHabitScreen({ id }: { id: string }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: found } = useLiveQuery(habitByIdQuery(id), [id]);
  const habit = found.at(0);

  if (!habit) return <View style={styles.screen} />;

  async function remove() {
    if (!habit) return;
    await deleteHabit(habit.id, new Date());
    router.dismissTo('/');
  }

  return (
    <HabitForm
      key={habit.id}
      title="Editar hábito"
      submitLabel="Salvar alterações"
      initial={{
        name: habit.name,
        description: habit.description ?? '',
        icon: habit.icon,
        color: paletteKeyOf(habit.color),
        schedule: scheduleOf(habit),
      }}
      onSubmit={(values) => updateHabit(habit.id, values, new Date())}
      onClose={() => router.back()}
      footer={
        <View style={styles.danger}>
          <Text variant="label" tone="inkFaint">
            Zona de risco
          </Text>
          <Button label="Excluir hábito" variant="ghost" onPress={() => setDeleteOpen(true)} />

          {/* destrutivo confirma, e a confirmacao nomeia o que se perde */}
          <ConfirmDialog
            visible={deleteOpen}
            destructive
            title={`Excluir ${habit.name}?`}
            message="O histórico de marcações desse hábito vai junto. Não dá para desfazer."
            confirmLabel="Excluir"
            onConfirm={remove}
            onClose={() => setDeleteOpen(false)}
          />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.ground },
  danger: { gap: space.sm, paddingTop: space.md },
});
