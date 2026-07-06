import '../services/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
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
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    Promise.all([loadTheme(), loadLocale()]).then(() => setAppReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && appReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appReady]);

  if (!fontsLoaded || !appReady) {
    return null;
  }

  return (
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
  );
}
