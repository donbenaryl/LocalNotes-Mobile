import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { PageHeader } from '@/components/ui/PageHeader';
import { DatePicker } from '@/components/ui/DatePicker';
import { BusinessSwitcherSheet } from './sheets/BusinessSwitcherSheet';

interface BusinessHomeHeaderProps {
  businessName: string;
  locationName: string;
  managerName: string;
  roleLabel: string;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  onDateRangeChange: (range: { dateFrom: string; dateTo: string }) => void;
  onBack: () => void;
  onToggleMembership?: () => void;
}

export function BusinessHomeHeader({
  businessName,
  locationName,
  managerName,
  roleLabel,
  periodLabel,
  dateFrom,
  dateTo,
  onDateRangeChange,
  onBack,
  onToggleMembership,
}: BusinessHomeHeaderProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const chevronColor = colorScheme === 'dark' ? '#A79E92' : '#6C727F';

  const openSwitcher = () => setSwitcherVisible(true);

  return (
    <>
      <PageHeader
        onBack={onBack}
        borderless
        rightChild={
          <DatePicker
            mode="range"
            dateFrom={dateFrom}
            dateTo={dateTo}
            displayValue={periodLabel}
            onChange={onDateRangeChange}
          />
        }
      >
        <View className="min-w-0 flex-1">
          <Text className="font-geist-extrabold text-lg text-ink dark:text-dk-text">
            {t('businessHome.title')}
          </Text>
          {/* Switch Business */}
          <Pressable
            onPress={openSwitcher}
            accessibilityRole="button"
            accessibilityLabel={
              locationName ? `${businessName}, ${locationName}` : businessName
            }
            className="mt-0.5 flex-row items-center self-start border-b border-dashed border-gray-500 dark:border-dk-muted cursor-pointer"
       
          >
            <Text className="font-geist-semibold text-[11.5px] leading-[16px] text-gray-500 dark:text-dk-muted">
              {businessName}
            </Text>
            {locationName ? (
              <>
                <Text className="font-geist-semibold text-[11.5px] leading-[16px] text-gray-500 dark:text-dk-muted">
                  {' · '}
                </Text>
                <Text className="ml-0.5 font-geist-semibold text-[11.5px] leading-[16px] text-gray-500 dark:text-dk-muted">
                  {locationName}
                </Text>
                <ChevronDown size={11} color={chevronColor} strokeWidth={2.4} />
              </>
            ) : null}
          </Pressable>
          <Pressable
            onLongPress={__DEV__ ? onToggleMembership : undefined}
            accessibilityRole="text"
          >
            <Text className="mt-0.5 font-geist-semibold text-[10px] text-gray-500 dark:text-dk-muted">
              {t('businessHome.managingAs', { name: managerName, role: roleLabel })}
            </Text>
          </Pressable>
        </View>
      </PageHeader>

      <BusinessSwitcherSheet
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </>
  );
}
