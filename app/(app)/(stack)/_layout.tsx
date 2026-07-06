import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function StackLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#111827' : '#fafaf7',
        },
      }}
    />
  );
}
