import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CollapsibleChrome } from '../../../components/ui/layout/CollapsibleChrome';
import { GuardedHeader } from '../../../components/ui/layout/GuardedHeader';
import { GuardedFooter } from '../../../components/ui/layout/GuardedFooter';
import { PickFormModal } from '../../../components/PageComponents/Profile/PickFormModal';
import { usePickModalStore } from '../../../stores/usePickModalStore';
import { useHomeChromeStore } from '../../../stores/useHomeChromeStore';

export default function TabsLayout() {
  const queryClient = useQueryClient();
  const { isOpen, close } = usePickModalStore();
  const isHidden = useHomeChromeStore((s) => s.isHidden);

  return (
    <View className="flex-1 bg-page">
      <CollapsibleChrome isHidden={isHidden}>
        <GuardedHeader />
      </CollapsibleChrome>
      <View className="flex-1">
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
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
