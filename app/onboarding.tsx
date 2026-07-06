import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainOnBoarding } from '../components/PageComponents/Auth/OnBoarding/MainOnBoarding';
import { hydrateUserProfile } from '../services/authBootstrap';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleOnboardingComplete() {
    await hydrateUserProfile();
    router.replace('/personality' as Href);
  }

  return (
    <View
      className="flex-1 bg-page dark:bg-gray-900 px-6"
      style={{ paddingTop: insets.top + 20 }}
    >
      <MainOnBoarding onComplete={() => void handleOnboardingComplete()} />
    </View>
  );
}
