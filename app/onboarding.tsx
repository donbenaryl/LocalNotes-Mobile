import { Redirect } from 'expo-router';
import type { Href } from 'expo-router';

/** Profile onboarding is completed during signup; keep this route for old deep links. */
export default function OnboardingScreen() {
  return (
    <Redirect
      href={{
        pathname: '/personality',
        params: { fromOnboarding: 'true' },
      } as Href}
    />
  );
}
