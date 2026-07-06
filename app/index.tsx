import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { bootstrapSession } from '../services/authBootstrap';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    async function init() {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const route = await bootstrapSession();
      router.replace(route as Href);
    }

    void init();
  }, []);

  return (
    <View className="flex-1 bg-brand items-center justify-center">
      <Text className="text-white text-4xl tracking-tight font-madimi">
        LocalNotes
      </Text>
    </View>
  );
}
