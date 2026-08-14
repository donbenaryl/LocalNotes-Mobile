import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BusinessOwnerTopType } from '@/hooks/useBusinessOwnerProfileInsights';

interface FeaturedInCardProps {
  listCount: number;
  monthDelta: number;
  topTypes: BusinessOwnerTopType[];
}

export function FeaturedInCard({
  listCount,
  monthDelta,
  topTypes,
}: FeaturedInCardProps) {
  const { t } = useTranslation();
  const [first, second] = topTypes;

  return (
    <View className="mt-3 rounded-2xl border border-gray-200 bg-soft px-4 py-3.5 dark:border-gray-700 dark:bg-gray-800">
      <View className="flex-row items-center gap-1.5">
        <View className="h-[5px] w-[5px] rotate-45 bg-brand" />
        <Text className="font-geist-bold text-[10.5px] uppercase tracking-[0.14em] text-brand-dark dark:text-brand">
          {t('profile.info.featuredIn.eyebrow')}
        </Text>
      </View>

      <Text className="mt-2 font-geist-extrabold text-[28px] leading-8 tracking-tight text-ink dark:text-gray-100">
        {listCount}{' '}
        <Text className="font-fraunces text-[22px] italic text-curator">
          {t('profile.info.featuredIn.lists')}
        </Text>
      </Text>

      {monthDelta > 0 || first ? (
        <Text className="mt-1.5 font-geist text-[12.5px] leading-[1.45] text-gray-600 dark:text-gray-400">
          {monthDelta > 0 ? (
            <Text>
              {t('profile.info.featuredIn.monthDelta', { count: monthDelta })}
              {first ? ' ' : ''}
            </Text>
          ) : null}
          {first && second ? (
            <>
              {t('profile.info.featuredIn.typesPrefix')}
              <Text style={{ color: first.color }} className="font-geist-bold">
                {first.label}
              </Text>
              {t('profile.info.featuredIn.typesAnd')}
              <Text style={{ color: second.color }} className="font-geist-bold">
                {second.label}
              </Text>
              {t('profile.info.featuredIn.typesSuffix')}
            </>
          ) : first ? (
            <>
              {t('profile.info.featuredIn.typePrefix')}
              <Text style={{ color: first.color }} className="font-geist-bold">
                {first.label}
              </Text>
              {t('profile.info.featuredIn.typeSuffix')}
            </>
          ) : null}
        </Text>
      ) : null}
    </View>
  );
}
