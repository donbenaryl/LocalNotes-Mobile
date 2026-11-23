import { Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function StackLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#161412' : '#F7F3EC',
        },
      }}
    >
      <Stack.Screen name="claim-business" />
    </Stack>
  );
}
