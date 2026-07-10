import { useLocalSearchParams } from 'expo-router';
import { SmartPickSessionTab } from '@/components/PageComponents/SmartPick/SmartPickSessionTab';

export default function SmartPickSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SmartPickSessionTab sessionId={id} />;
}
