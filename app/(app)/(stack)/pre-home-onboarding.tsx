import { useRouter } from 'expo-router';
import { OnBoardingPreHome } from '@/components/PageComponents/OnBoardingPreHome';

export default function PreHomeOnboardingScreen() {
  const router = useRouter();

  const handleComplete = () => {
    router.replace('/home');
  };

  return <OnBoardingPreHome onComplete={handleComplete} />;
}
