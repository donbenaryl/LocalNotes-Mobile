import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { Check, MapPin } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useBusinessStore } from '@/stores/useBusinessStore';
import type { BusinessBranchDAO } from '@/http/business-api/types';

interface BusinessSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

function branchLabel(branch: BusinessBranchDAO): string {
  return branch.name?.trim() || branch.location?.city || '';
}

export function BusinessSwitcherSheet({
  visible,
  onClose,
}: BusinessSwitcherSheetProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const checkColor = colorScheme === 'dark' ? '#F3F4F6' : '#141413';
  const ownedBusinesses = useBusinessStore((s) => s.ownedBusinesses);
  const businessId = useBusinessStore((s) => s.businessId);
  const selectedBranchId = useBusinessStore((s) => s.selectedBranchId);
  const isFetchingOwned = useBusinessStore((s) => s.isFetchingOwned);
  const ownedError = useBusinessStore((s) => s.ownedError);
  const loadOwnedBusinesses = useBusinessStore((s) => s.loadOwnedBusinesses);
  const selectBusiness = useBusinessStore((s) => s.selectBusiness);
  const selectBranch = useBusinessStore((s) => s.selectBranch);

  const [draftBusinessId, setDraftBusinessId] = useState(businessId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraftBusinessId(businessId);
    setSaveError(null);
    void loadOwnedBusinesses();
  }, [visible, businessId, loadOwnedBusinesses]);

  const draftBusiness = useMemo(
    () =>
      ownedBusinesses.find((item) => item.id === draftBusinessId) ??
      ownedBusinesses.find((item) => item.is_primary) ??
      ownedBusinesses[0],
    [ownedBusinesses, draftBusinessId],
  );

  const branches = draftBusiness?.branches ?? [];

  const commitSelection = async (nextBusinessId: string, branchId: string | null) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (nextBusinessId !== businessId) {
        const result = await selectBusiness(nextBusinessId);
        if (!result.ok) {
          setSaveError(result.message ?? t('businessHome.switcher.error'));
          return;
        }
      }
      selectBranch(branchId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const onBusinessPress = (id: string) => {
    if (isSaving) return;
    const next = ownedBusinesses.find((item) => item.id === id);
    setDraftBusinessId(id);
    if (next && next.branches.length === 0) {
      void commitSelection(id, null);
    }
  };

  const onLocationPress = (branchId: string) => {
    if (isSaving || !draftBusiness) return;
    void commitSelection(draftBusiness.id, branchId);
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-4"
        className="max-h-[70vh]"
      >
        <Text className="font-geist-extrabold text-[10px] uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
          {t('businessHome.switcher.yourBusinesses')}
        </Text>

        {isFetchingOwned && ownedBusinesses.length === 0 ? (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#FF6B1A" />
            <Text className="mt-2 font-geist text-xs text-gray-500">
              {t('businessHome.switcher.loading')}
            </Text>
          </View>
        ) : ownedError && ownedBusinesses.length === 0 ? (
          <View className="items-center py-6">
            <Text className="mb-3 text-center font-geist text-sm text-gray-600 dark:text-gray-400">
              {ownedError || t('businessHome.switcher.error')}
            </Text>
            <LocalNotesButton
              label={t('businessHome.switcher.retry')}
              onPress={() => void loadOwnedBusinesses()}
              variant="light"
              size="xs"
              isRounded
              isWidthFull={false}
            />
          </View>
        ) : ownedBusinesses.length === 0 ? (
          <Text className="py-4 font-geist text-sm text-gray-500">
            {t('businessHome.switcher.empty')}
          </Text>
        ) : (
          ownedBusinesses.map((item, index) => {
            const isDraft = item.id === draftBusiness?.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onBusinessPress(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isDraft }}
                className={`flex-row items-center justify-between py-3 cursor-pointer ${
                  index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <View className="min-w-0 flex-1 flex-row items-center gap-1.5 pr-3">
                  <Text
                    className="font-geist-bold text-[15px] text-ink dark:text-gray-100"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {isDraft ? (
                    <Check size={14} color={checkColor} strokeWidth={2.6} />
                  ) : null}
                </View>
                <Text className="font-geist-semibold text-[11px] text-gray-500 dark:text-gray-400">
                  {t('businessHome.switcher.locationCount', {
                    count: item.location_count ?? item.branches.length,
                    role: item.role,
                  })}
                </Text>
              </Pressable>
            );
          })
        )}

        <Text className="mt-3 font-geist-extrabold text-[10px] uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
          {t('businessHome.switcher.locations')}
        </Text>

        {saveError ? (
          <Text className="mt-2 font-geist text-sm text-error">{saveError}</Text>
        ) : null}

        {isSaving ? (
          <View className="items-center py-3">
            <ActivityIndicator size="small" color="#FF6B1A" />
          </View>
        ) : null}

        {branches.length === 0 ? (
          <Text className="py-4 font-geist text-sm text-gray-500">
            {t('businessHome.switcher.noLocations')}
          </Text>
        ) : (
          branches.map((branch, index) => {
            const isSelected =
              draftBusiness?.id === businessId && branch.id === selectedBranchId;
            const label = branchLabel(branch);
            return (
              <Pressable
                key={branch.id}
                onPress={() => onLocationPress(branch.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                className={`flex-row items-center gap-2 py-3 cursor-pointer ${
                  index > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <MapPin size={14} color="#EF4444" strokeWidth={2.2} />
                <Text
                  className="flex-1 font-geist-bold text-[15px] text-ink dark:text-gray-100"
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {isSelected ? (
                  <Check size={14} color={checkColor} strokeWidth={2.6} />
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </Modal>
  );
}
