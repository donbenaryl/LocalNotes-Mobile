import { useLocalSearchParams } from 'expo-router';
import { ListDetailsMain } from '@/components/PageComponents/List/ListDetails/ListDetailsMain';

export default function ListDetailScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const id = Array.isArray(listId) ? listId[0] : listId;

  return <ListDetailsMain listId={id} />;
}
