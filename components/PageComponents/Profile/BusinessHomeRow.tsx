import { Alert, Pressable, Text, View } from 'react-native';
import { ChevronRight, LayoutGrid } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

export function BusinessHomeRow() {
  const { t } = useTranslation();

  const onPress = () => {
    Alert.alert(
      t('profile.info.businessHome.comingSoonTitle'),
      t('profile.info.businessHome.comingSoonMessage'),
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('profile.info.businessHome.title')}
      className="mt-3.5 flex-row items-center gap-3 rounded-2xl bg-ink px-3.5 py-3.5 active:opacity-90 dark:bg-gray-900 dark:border dark:border-gray-700"
    >
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: '#543625'
        }}
      >
        <LayoutGrid size={16} color="#FDC7A5" strokeWidth={2} />
      </View>
 
      <View className="min-w-0 flex-1">
        <Text className="font-geist-semibold text-[13.5px] leading-tight text-white">
          {t('profile.info.businessHome.title')}
        </Text>
        <Text className="mt-0.5 font-geist text-[11.5px] leading-tight text-white/55">
          {t('profile.info.businessHome.subtitle')}
        </Text>
      </View>
      <ChevronRight size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
    </Pressable>
  );
}
