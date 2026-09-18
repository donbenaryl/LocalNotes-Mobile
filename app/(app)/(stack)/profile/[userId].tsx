import { useLocalSearchParams } from 'expo-router';
import MainProfile from '@/components/PageComponents/Profile/MainProfile';
import { parseViewOrigin } from '@/utils/viewTracking';

export default function OtherUserProfileScreen() {
  const { userId, origin } = useLocalSearchParams<{
    userId: string;
    origin?: string;
  }>();
  const id = Array.isArray(userId) ? userId[0] : userId;
  return (
    <MainProfile
      userId={id}
      viewOrigin={parseViewOrigin(origin) ?? 'other'}
    />
  );
}
