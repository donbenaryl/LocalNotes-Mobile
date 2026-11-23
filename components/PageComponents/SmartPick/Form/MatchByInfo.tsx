import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SMART_PICK_ENGINES } from '@/constants/smartPick';

export function MatchByInfo() {
  const { t } = useTranslation();

  return (
    <View className="gap-2">
      {SMART_PICK_ENGINES.map((engine) => (
        <Text
          key={engine.value}
          className="font-geist text-[13px] leading-5 text-gray-600 dark:text-dk-body"
        >
          <Text className="font-geist-semibold text-ink dark:text-dk-text">{engine.name}</Text>
          {` · ${engine.detail}`}
        </Text>
      ))}
      <Text className="font-geist text-[12.5px] text-gray-400 dark:text-dk-faint">
        {t('smartPick.matchByVibesHint')}
      </Text>
    </View>
  );
}
