import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';

/** Pre-home steps live inside OnboardingFlow on /personality; keep route for old deep links. */
export default function PreHomeOnboardingScreen() {
  return (
    <Redirect
      href={
        {
          pathname: '/personality',
          params: { fromOnboarding: 'true' },
        } as Href
      }
    />
  );
}
