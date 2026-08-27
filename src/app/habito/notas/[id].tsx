import { useLocalSearchParams } from 'expo-router';

import { HabitNotesScreen } from '@/features/habit-notes/habit-notes-screen';

export default function NotasDoHabitoRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HabitNotesScreen id={id} />;
}
