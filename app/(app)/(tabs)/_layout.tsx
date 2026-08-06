import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { GuardedFooter } from '../../../components/ui/layout/GuardedFooter';
import { PickFormModal } from '../../../components/PageComponents/Profile/PickFormModal';
import { usePickModalStore } from '../../../stores/usePickModalStore';

export default function TabsLayout() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isOpen, close } = usePickModalStore();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <Tabs
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            lazy: true,
            animation: 'none',
            freezeOnBlur: false,
            sceneStyle: { backgroundColor: 'transparent' },
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="home" options={{ title: 'Home' }} />
          <Tabs.Screen name="smart-pick" options={{ title: 'Smart Picks' }} />
          <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
          <Tabs.Screen name="search" options={{ title: 'Search' }} />
        </Tabs>
      </View>
      <GuardedFooter />
      <PickFormModal
        visible={isOpen}
        onClose={close}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ['profile-picks'] });
          close();
        }}
      />
    </View>
  );
}
