import { useLocalSearchParams } from 'expo-router';

import { HabitDetailScreen } from '@/features/habit-detail/habit-detail-screen';

export default function HabitoRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <HabitDetailScreen id={id} />;
}
