import { useLocalSearchParams } from 'expo-router';

import { EditHabitScreen } from '@/features/habit-form/edit-habit-screen';

export default function EditarHabitoRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditHabitScreen id={id} />;
}
