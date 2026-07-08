import { useLocalSearchParams } from 'expo-router';
import { ListForm } from '@/components/PageComponents/List/ListForm';

export default function EditListScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();

  return <ListForm step={1} listId={listId} />;
}
