import { useCallback, useState } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useRouter, usePathname } from 'expo-router';
import { LayoutGrid, Bookmark, Search, Plus, Star } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { usePickModalStore } from '@/stores/usePickModalStore';
import { useListFormStore } from '@/stores/useListFormStore';
import {
  getSectionId,
  SECTION_ENTRY_HREF,
  type SectionId,
} from '@/constants/swipeNavigation';
import { navigateToSection } from '@/utils/navigateToSection';
import { DropDown, type DropDownOption } from '@/components/ui/DropDown';

const BRAND = '#FF6B1A';
const INACTIVE_LIGHT = '#9CA3AF';
const INACTIVE_DARK = '#6B7280';

interface FooterTab {
  id: SectionId;
  label: string;
  Icon: LucideIcon;
}

/**
 * Sections in SECTION_ORDER sequence, so left-to-right in the bar matches the
 * forward direction of the swipe ring. Destinations come from
 * SECTION_ENTRY_HREF / lastHrefBySection — never hardcode a route here.
 */
const TABS: readonly (FooterTab | null)[] = [
  { id: 'home', label: 'Home', Icon: LayoutGrid },
  { id: 'smart-pick', label: 'Smart Picks', Icon: Star },
  null,
  { id: 'saved', label: 'Saved', Icon: Bookmark },
  { id: 'search', label: 'Search', Icon: Search },
];

const FAB_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  android: { elevation: 8 },
  default: {},
});

const CREATE_OPTIONS: DropDownOption[] = [
  { value: 'pick', label: 'Create a Pick' },
  { value: 'list', label: 'Create a List' },
];

const BAR_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  android: { elevation: 10 },
  default: {},
});

export function GuardedFooter() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const inactiveColor = colorScheme === 'dark' ? INACTIVE_DARK : INACTIVE_LIGHT;
  const openPickModal = usePickModalStore((s) => s.open);
  const resetListForm = useListFormStore((s) => s.reset);
  const [isCreatePickerOpen, setIsCreatePickerOpen] = useState(false);

  const activeSection = getSectionId(pathname);
  const bottomInset = Math.max(insets.bottom, 12);

  const handleCreateOptionSelect = (value: string) => {
    if (value === 'pick') {
      openPickModal();
    } else {
      resetListForm();
      router.push('/(app)/(stack)/lists/new' as never);
    }
  };

  // Keep-alive Tabs: navigate (never replace) so section shells stay mounted.
  const handleTabPress = useCallback(
    (to: SectionId) => {
      const from = getSectionId(pathname);

      // Re-tap active section → section root (Facebook "tap again to root").
      if (from === to) {
        router.navigate(SECTION_ENTRY_HREF[to]);
        return;
      }

      navigateToSection(router, to);
    },
    [pathname, router],
  );

  if (activeSection === 'search') return null;

  return (
    <View
      className="absolute -bottom-4 left-0 right-0 z-10 items-center px-4"
      style={{ paddingBottom: bottomInset }}
      pointerEvents="box-none"
    >
      <View className="relative w-full max-w-md">
        <View
          className="absolute top-2 left-0 right-0 z-20 items-center"
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={() => setIsCreatePickerOpen(true)}
            className="h-14 w-14 items-center justify-center rounded-full border-[3px] border-page bg-brand cursor-pointer dark:border-gray-900"
            style={FAB_SHADOW}
          >
            <Plus size={26} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View
          className="w-full flex-row items-center rounded-full border border-gray-200/70 bg-page/90 dark:border-gray-700/70 dark:bg-gray-900/90"
          style={[{ height: 64 }, BAR_SHADOW]}
        >
          {TABS.map((tab) => {
            if (tab === null) {
              return <View key="fab-spacer" className="flex-1" />;
            }

            const isActive = activeSection === tab.id;
            const iconColor = isActive ? BRAND : inactiveColor;

            return (
              <TouchableOpacity
                key={tab.id}
                className="min-w-0 flex-1 items-center justify-center cursor-pointer"
                onPress={() => handleTabPress(tab.id)}
              >
                <View
                  className={`items-center justify-center rounded-full px-3 py-1.5`}
                >
                  <tab.Icon
                    size={22}
                    color={iconColor}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <Text
                    className={`mt-0.5 text-[10px] font-geist ${
                      isActive ? 'text-brand' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <DropDown
        visible={isCreatePickerOpen}
        selected=""
        onApply={handleCreateOptionSelect}
        onClose={() => setIsCreatePickerOpen(false)}
        options={CREATE_OPTIONS}
      />
    </View>
  );
}
