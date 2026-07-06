import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <View className={`border-b border-gray-200 dark:border-gray-700 ${className ?? ''}`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              activeOpacity={1}
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className={`px-2 relative flex-row items-center gap-2 pb-3 mr-6 cursor-pointer border-b-2 ${
                isActive
                  ? 'border-brand'
                  : 'border-transparent'
              }`}
            >
              <Icon
                size={12}
                color={isActive ? '#FF6B1A' : '#9CA3AF'}
              />
              <Text
                className={
                  isActive
                    ? 'text-ink dark:text-gray-100 font-geist-bold'
                    : 'text-gray-500 dark:text-gray-400 font-geist-semibold'
                }
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
