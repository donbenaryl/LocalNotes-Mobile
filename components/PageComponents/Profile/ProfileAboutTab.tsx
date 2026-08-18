import { useEffect, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  Globe,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { BranchLocationCard } from '@/components/PageComponents/Profile/BranchLocationCard';
import { WhiteBox } from '@/components/ui/WhiteBox';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';
import { useBusinessStore } from '@/stores/useBusinessStore';
import { resolveImageUrl } from '@/utils/httpHelpers';
import { ICON_COLOR_DARK, ICON_COLOR_LIGHT } from '@/constants/colors';

function formatStatCount(value: number | undefined): string {
  const n = value ?? 0;
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const thousands = n / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return String(Math.round(n));
}

interface AboutRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}

function AboutRow({ icon, label, value, onPress }: AboutRowProps) {
  const content = (
    <View className="flex-row items-start gap-3 py-3">
      <View className="mt-0.5">{icon}</View>
      <View className="min-w-0 flex-1">
        <Text className="font-geist-semibold text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </Text>
        <Text className="mt-0.5 font-geist text-[13.5px] leading-[1.4] text-ink dark:text-gray-100">
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="active:opacity-70"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

function LocationCardSkeleton() {
  return (
    <WhiteBox>
      <View className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
      <View className="mt-3 h-44 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      <View className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <View className="mt-2 h-3.5 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
      <View className="mt-4 h-[46px] rounded-full bg-gray-200 dark:bg-gray-700" />
    </WhiteBox>
  );
}

function ProfileAboutTabSkeleton() {
  return (
    <View className="gap-3">
      <WhiteBox>
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 gap-2">
            <View className="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-700" />
            <View className="h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-700" />
          </View>
        </View>
      </WhiteBox>
      <LocationCardSkeleton />
    </View>
  );
}

export function ProfileAboutTab() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? ICON_COLOR_DARK : ICON_COLOR_LIGHT;
  const { coordinates: userCoordinates } = useUserCoordinates();

  const businessInfo = useBusinessStore((s) => s.businessInfo);
  const isFetching = useBusinessStore((s) => s.isFetching);
  const hasFetched = useBusinessStore((s) => s.hasFetched);
  const loadBusinessInfo = useBusinessStore((s) => s.loadBusinessInfo);

  useEffect(() => {
    if (!hasFetched) {
      void loadBusinessInfo();
    }
  }, [hasFetched, loadBusinessInfo]);

  if (isFetching && !businessInfo) {
    return (
      <View className="px-4 pt-4">
        <ProfileAboutTabSkeleton />
      </View>
    );
  }

  if (hasFetched && !businessInfo) {
    return (
      <View className="items-center px-4 py-12">
        <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
          {t('profile.about.empty')}
        </Text>
      </View>
    );
  }

  if (!businessInfo) {
    return (
      <View className="items-center px-4 py-12">
        <ActivityIndicator size="small" color="#FF6B1A" />
        <Text className="mt-3 font-geist text-sm text-gray-500 dark:text-gray-400">
          {t('profile.about.loading')}
        </Text>
      </View>
    );
  }

  const logoUri = businessInfo.logo
    ? resolveImageUrl(businessInfo.logo) ?? businessInfo.logo
    : null;

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const stats = [
    {
      value: formatStatCount(businessInfo.follower_count),
      label: t('profile.info.stats.followers'),
    },
    {
      value: formatStatCount(businessInfo.list_count),
      label: t('profile.info.stats.lists'),
    },
    {
      value: formatStatCount(businessInfo.share_count),
      label: t('profile.about.shares'),
    },
  ];

  const hasContact =
    Boolean(businessInfo.contact_email) ||
    Boolean(businessInfo.phone_number) ||
    Boolean(businessInfo.website);

  return (
    <View className="gap-3 px-4 pt-4">
      <WhiteBox>
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 overflow-hidden rounded-xl bg-soft dark:bg-gray-700">
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Text className="font-geist-bold text-lg text-gray-400">
                  {businessInfo.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="font-geist-extrabold text-[17px] text-ink dark:text-gray-100"
              numberOfLines={2}
            >
              {businessInfo.name}
            </Text>
            {businessInfo.business_type ? (
              <Text className="mt-0.5 font-geist-semibold text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {businessInfo.business_type}
              </Text>
            ) : null}
          </View>
        </View>

        {businessInfo.bio ? (
          <Text className="mt-3 font-geist text-[13.5px] leading-[1.45] text-gray-600 dark:text-gray-400">
            {businessInfo.bio}
          </Text>
        ) : null}

        {/* <View className="mt-4 flex-row rounded-xl bg-soft py-3 dark:bg-gray-900">
          {stats.map((stat, index) => (
            <View
              key={stat.label}
              className={`flex-1 items-center ${
                index > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''
              }`}
            >
              <Text className="font-geist-extrabold text-[16px] text-ink dark:text-gray-100">
                {stat.value}
              </Text>
              <Text className="mt-0.5 font-geist-semibold text-[10.5px] uppercase text-gray-400 dark:text-gray-500">
                {stat.label}
              </Text>
            </View>
          ))}
        </View> */}
      </WhiteBox>

      {businessInfo.branches?.map((branch) => (
        <BranchLocationCard
          key={branch.id}
          branch={branch}
          businessName={businessInfo.name}
          logoUri={logoUri}
          userCoordinates={userCoordinates}
        />
      ))}

      {hasContact ? (
        <WhiteBox>
          <Text className="font-geist-bold text-[10.5px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            {t('profile.about.contact')}
          </Text>
          {businessInfo.contact_email ? (
            <AboutRow
              icon={<Mail size={16} color={iconColor} strokeWidth={2} />}
              label={t('profile.about.email')}
              value={businessInfo.contact_email}
              onPress={() => openUrl(`mailto:${businessInfo.contact_email}`)}
            />
          ) : null}
          {businessInfo.phone_number ? (
            <AboutRow
              icon={<Phone size={16} color={iconColor} strokeWidth={2} />}
              label={t('profile.about.phone')}
              value={businessInfo.phone_number}
              onPress={() => openUrl(`tel:${businessInfo.phone_number}`)}
            />
          ) : null}
          {businessInfo.website ? (
            <AboutRow
              icon={<Globe size={16} color={iconColor} strokeWidth={2} />}
              label={t('profile.about.website')}
              value={businessInfo.website}
              onPress={() => {
                const url = businessInfo.website!.startsWith('http')
                  ? businessInfo.website!
                  : `https://${businessInfo.website}`;
                openUrl(url);
              }}
            />
          ) : null}
        </WhiteBox>
      ) : null}
    </View>
  );
}
