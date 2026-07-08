import { useLocalSearchParams } from 'expo-router';
import { ListForm } from '@/components/PageComponents/List/ListForm';

export default function EditListShareScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return <ListForm step={2} listId={listId} />;
}
