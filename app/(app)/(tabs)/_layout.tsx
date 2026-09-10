import { StyleSheet, View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { SectionShellPager } from '@/components/ui/SectionShellPager';
import { GuardedFooter } from '@/components/ui/layout/GuardedFooter';
import { PickFormModal } from '@/components/PageComponents/Profile/PickFormModal';
import { getSectionId } from '@/constants/swipeNavigation';
import { usePickModalStore } from '@/stores/usePickModalStore';
import { useSectionRouteStore } from '@/stores/useSectionRouteStore';

/**
 * Visible UI is SectionShellPager (SECTION_ORDER). Hidden Tabs exist only so
 * router.navigate / deep links still resolve to section URLs.
 *
 * Android still uses this shell (not a second Tabs UI tree): Expo Tabs scenes
 * were laying out at 0 height under the custom footer. Feed blanks are fixed
 * in SectionTabsScrollLayout (chrome inside ScrollView), not by swapping trees.
 */
export default function TabsLayout() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const pendingSection = useSectionRouteStore((s) => s.pendingSection);
  const syncSectionFromPathname = useSectionRouteStore(
    (s) => s.syncSectionFromPathname,
  );
  const { isOpen, close } = usePickModalStore();

  useEffect(() => {
    const pathSection = getSectionId(pathname);
    if (!pathSection) return;
    syncSectionFromPathname(pathSection);
  }, [pathname, pendingSection, syncSectionFromPathname]);

  return (
    <View
      style={[styles.root, { paddingTop: insets.top }]}
      className="bg-page dark:bg-gray-900"
    >
      <View style={styles.fill}>
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
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
    minHeight: 0,
  },
  urlTabs: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  shell: {
    flex: 1,
    minHeight: 0,
  },
});
