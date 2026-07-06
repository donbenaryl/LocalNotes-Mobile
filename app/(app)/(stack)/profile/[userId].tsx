import { useLocalSearchParams } from 'expo-router';
import MainProfile from '@/components/PageComponents/Profile/MainProfile';

export default function OtherUserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const id = Array.isArray(userId) ? userId[0] : userId;
  return <MainProfile userId={id} />;
}
