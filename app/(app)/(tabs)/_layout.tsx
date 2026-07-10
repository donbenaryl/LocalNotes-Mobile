import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { CollapsibleChrome } from '../../../components/ui/layout/CollapsibleChrome';
import { GuardedHeader } from '../../../components/ui/layout/GuardedHeader';
import { GuardedFooter } from '../../../components/ui/layout/GuardedFooter';
import { PickFormModal } from '../../../components/PageComponents/Profile/PickFormModal';
import { usePickModalStore } from '../../../stores/usePickModalStore';
import { useHomeChromeStore } from '../../../stores/useHomeChromeStore';

export default function TabsLayout() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isOpen, close } = usePickModalStore();
  const isHidden = useHomeChromeStore((s) => s.isHidden);

  return (
    // Reserve the status-bar/notch inset permanently here so it survives the
    // GuardedHeader collapsing to height 0 — the Tabs then land just below the
    // safe area when the header is hidden.
    <View className="flex-1 bg-page dark:bg-gray-900" style={{ paddingTop: insets.top }}>
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
