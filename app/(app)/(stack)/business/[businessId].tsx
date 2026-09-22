import { useLocalSearchParams } from 'expo-router';
import MainProfile from '@/components/PageComponents/Profile/MainProfile';
import { parseViewOrigin } from '@/utils/viewTracking';

export default function BusinessProfileScreen() {
  const { businessId, origin } = useLocalSearchParams<{
    businessId: string;
    origin?: string;
  }>();
  const id = Array.isArray(businessId) ? businessId[0] : businessId;
  return (
    <MainProfile
      businessId={id}
      viewOrigin={parseViewOrigin(origin) ?? 'other'}
    />
  );
}
