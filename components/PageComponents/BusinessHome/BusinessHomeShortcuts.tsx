import { Alert, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { cn } from '@/utils/cn';

export function BusinessHomeShortcuts() {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  const shortcuts: {
    id: string;
    icon: string;
    labelKey: string;
    primary?: boolean;
  }[] = [
    { id: 'promote', icon: '📣', labelKey: 'businessHome.shortcuts.promote', primary: true },
    { id: 'campaigns', icon: '🧾', labelKey: 'businessHome.shortcuts.campaigns' },
    { id: 'analytics', icon: '⌁', labelKey: 'businessHome.shortcuts.analytics' },
  ];

  return (
    <View className="flex-row gap-1.5 px-4 pt-2.5">
      {shortcuts.map((item) => (
        <Pressable
          key={item.id}
          onPress={showComingSoon}
          accessibilityRole="button"
          className="flex-1"
        >
          <WhiteBox
            className={cn(
              'min-h-[46px] items-center justify-center px-1 py-2',
              item.primary && 'border-ink bg-ink dark:border-gray-100 dark:bg-gray-100',
            )}
          >
            <Text className="text-[15px]">{item.icon}</Text>
            <Text
              className={cn(
                'font-geist-extrabold text-[11px]',
                item.primary ? 'text-white dark:text-ink' : 'text-ink dark:text-gray-100',
              )}
            >
              {t(item.labelKey)}
            </Text>
          </WhiteBox>
        </Pressable>
      ))}
    </View>
  );
}
