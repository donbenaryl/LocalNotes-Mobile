import '../services/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { AppState, type AppStateStatus, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { MadimiOne_400Regular } from '@expo-google-fonts/madimi-one';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
} from '@expo-google-fonts/geist';
import { Fraunces_400Regular_Italic } from '@expo-google-fonts/fraunces';
import { useThemeStore } from '../stores/useThemeStore';
import { useLocaleStore } from '../stores/useLocaleStore';
import { useAccountSettingsStore } from '../stores/useAccountSettingsStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useBiometricStore } from '../stores/useBiometricStore';
import { ToastViewport } from '../components/ui/Toast';
import '../global.css';

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MadimiOne_400Regular,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Geist_800ExtraBold,
    Fraunces_400Regular_Italic,
  });

  const { loadTheme } = useThemeStore();
  const { loadLocale } = useLocaleStore();
  const loadPrefs = useAccountSettingsStore((s) => s.loadPrefs);
  const loadBiometric = useBiometricStore((s) => s.load);
  const [appReady, setAppReady] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    async function bootstrap() {
      await useAuthStore.getState().loadToken();
      await Promise.all([
        loadTheme(),
        loadLocale(),
        loadPrefs(),
        loadBiometric(),
      ]);

      const { isAuthenticated, lockSession } = useAuthStore.getState();
      if (isAuthenticated && useBiometricStore.getState().enabled) {
        lockSession();
      }

      setAppReady(true);
    }
    void bootstrap();
  }, [loadTheme, loadLocale, loadPrefs, loadBiometric]);

  useEffect(() => {
    if (fontsLoaded && appReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const wasActive = appState.current === 'active';
        appState.current = nextState;

        if (wasActive && nextState === 'background') {
          const { isAuthenticated, lockSession } = useAuthStore.getState();
          const biometricEnabled = useBiometricStore.getState().enabled;
          if (isAuthenticated && biometricEnabled) {
            lockSession();
          }
        }
      },
    );

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || !appReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View className="flex-1 bg-page dark:bg-gray-900">
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <ToastViewport />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
