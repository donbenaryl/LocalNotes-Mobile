import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { bootstrapSession } from '../services/authBootstrap';
import { checkForceUpdateRequired } from '../utils/appVersionGate';
import { useSplashStore } from '../stores/useSplashStore';

/**
 * Route resolver. The visible splash is `SplashOverlay` (mounted in the root
 * layout), which keeps animating while this decides where to go and then
 * lands its wordmark on the destination's logo.
 */
function waitForIntro(): Promise<void> {
  return new Promise((resolve) => {
    if (useSplashStore.getState().introDone) return resolve();
    const unsub = useSplashStore.subscribe((s) => {
      if (s.introDone) {
        unsub();
        resolve();
      }
    });
  });
}

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { setTarget } = useSplashStore.getState();

      const forceUpdate = await checkForceUpdateRequired();
      const route = forceUpdate.required ? '/force-update' : await bootstrapSession();

      // Mounting the destination mid-intro stalls the UI thread and freezes the
      // animation, so wait until the intro has finished and the word is held.
      await waitForIntro();

      if (forceUpdate.required) {
        router.replace('/force-update' as Href);
        setTarget('none');
        return;
      }
      router.replace(route as Href);
      setTarget(
        route === '/home' ? 'home' : route === '/welcome' ? 'welcome' : 'none',
      );
    }

    void init();
  }, [router]);

  return <View className="flex-1 bg-page dark:bg-dk-page" />;
}
