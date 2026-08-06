import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { SectionShellPager } from '@/components/ui/SectionShellPager';
import { GuardedFooter } from '@/components/ui/layout/GuardedFooter';
import { PickFormModal } from '@/components/PageComponents/Profile/PickFormModal';
import { usePickModalStore } from '@/stores/usePickModalStore';

/**
 * Visible UI is SectionShellPager (SECTION_ORDER). Hidden Tabs exist only so
 * router.navigate / deep links still resolve to section URLs.
 */
export default function TabsLayout() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const { isOpen, close } = usePickModalStore();

  return (
    <View className="flex-1 bg-page dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      <View className="flex-1">
        <View
          pointerEvents="none"
          style={styles.urlTabs}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Tabs
            tabBar={() => null}
            screenOptions={{
              headerShown: false,
              lazy: false,
              freezeOnBlur: false,
            }}
          >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="smart-pick" />
            <Tabs.Screen name="saved" />
            <Tabs.Screen name="search" />
          </Tabs>
        </View>
        <View style={styles.shell}>
          <SectionShellPager />
        </View>
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

const styles = StyleSheet.create({
  urlTabs: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  shell: {
    flex: 1,
  },
});
