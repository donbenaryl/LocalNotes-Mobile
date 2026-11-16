import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, MapPin, Plus, Shuffle, Sparkles, Target } from 'lucide-react-native';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useSmartPickHistory } from '@/hooks/useSmartPickHistory';
import { MAX_SMART_PICK_VIBES, SMART_PICK_ENGINES, SMART_PICK_OCCASIONS, SMART_PICK_TIMES, SMART_PICK_VIBES } from '@/constants/smartPick';
import { MatchByInfo } from './MatchByInfo';
import { SmartPickPeopleSheet } from './SmartPickPeopleSheet';
import type { SmartPickFormState, SmartPickMode } from '../types';
import { PageSectionTitle } from '@/components/ui/PageSectionTitle';
import type { searchUserDAO } from '@/http/account-api/types';
import { LocationPickerChip } from '@/components/ui/LocationInputModal';
import type { Location as GeoLocation } from '@/http/list-api/types';

interface SmartPickFormProps {
  formState: SmartPickFormState;
  onChange: (patch: Partial<SmartPickFormState>) => void;
  onAddLinkedUser: (user: searchUserDAO) => void;
  onRemoveLinkedUser: (userId: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  cityLabel: string;
  isLocationLoading: boolean;
  onLocationSelected: (location: GeoLocation) => void;
}

const ENGINE_ICONS = {
  'My Personality Match': Target,
  'Try Something Opposite': Shuffle,
  'Local Vibes': MapPin,
} as const;

const LABEL_CLASS = 'normal-case tracking-normal';

export function SmartPickForm({
  formState,
  onChange,
  onAddLinkedUser,
  onRemoveLinkedUser,
  onSubmit,
  onSkip,
  isSubmitting,
  errorMessage,
  cityLabel,
  isLocationLoading,
  onLocationSelected,
}: SmartPickFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isPeopleSheetOpen, setIsPeopleSheetOpen] = useState(false);
  const { conversations, isPending: isHistoryPending } = useSmartPickHistory();

  const canSubmit = Boolean(
    formState.occasion &&
      formState.timeOfDay &&
      (formState.mode === 'Personality' ? formState.engine : formState.vibes.length > 0),
  );

  const handleModeChange = (mode: SmartPickMode) => {
    if (mode === formState.mode) return;
    onChange({
      mode,
      engine: mode === 'Personality' ? formState.engine : null,
      vibes: mode === 'Vibe' ? formState.vibes : [],
    });
  };

  const handleVibeToggle = (vibe: string) => {
    const isSelected = formState.vibes.includes(vibe);
    if (isSelected) {
      onChange({ vibes: formState.vibes.filter((v) => v !== vibe) });
    } else if (formState.vibes.length < MAX_SMART_PICK_VIBES) {
      onChange({ vibes: [...formState.vibes, vibe] });
    }
  };

  const closePeopleSheet = () => setIsPeopleSheetOpen(false);

  return (
    <View className="gap-6 pb-10 pt-4 bg-page dark:bg-gray-900">
      {/* Welcome banner */}
      <View className="overflow-hidden rounded-[18px]">
        <LinearGradient
          colors={['#FF6B1A', '#c2410c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18 }}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={12} color="#fff" />
              <Text className="font-geist-medium text-sm uppercase tracking-[0.16em] text-white">
                {t('smartPick.welcomeEyebrow')}
              </Text>
            </View>
            <LocationPickerChip
              cityLabel={cityLabel}
              isLoading={isLocationLoading}
              onLocationSelected={onLocationSelected}
            />
          </View>
          <Text className="font-geist-semibold text-2xl leading-6 text-white">
            {t('smartPick.welcomeTitle')}
          </Text>
          <Text className="mt-1 font-geist leading-5 text-white/85">
            {t('smartPick.welcomeDetail')}
          </Text>
        </LinearGradient>
      </View>

      {/* Occasion */}
      <View className="gap-3">
        <PageSectionTitle className={LABEL_CLASS}>{t('smartPick.occasionQuestion')}</PageSectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {SMART_PICK_OCCASIONS.map((occasion) => (
            <CategoryChip
              key={occasion}
              label={occasion}
              isSelected={formState.occasion === occasion}
              onPress={() => onChange({ occasion })}
            />
          ))}
        </View>
      </View>

      {/* Time of day */}
      <View className="gap-3">
        <PageSectionTitle className={LABEL_CLASS}>{t('smartPick.timeQuestion')}</PageSectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {SMART_PICK_TIMES.map((time) => (
            <CategoryChip
              key={time}
              label={time}
              isSelected={formState.timeOfDay === time}
              onPress={() => onChange({ timeOfDay: time })}
            />
          ))}
        </View>
      </View>

      {/* Who's going */}
      <View className="gap-3">
        <PageSectionTitle className={LABEL_CLASS}>{t('smartPick.linkProfileLabel')}</PageSectionTitle>
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="min-w-0 flex-1 font-geist-medium text-base text-ink dark:text-gray-100"
            numberOfLines={1}
          >
            {formState.linkedUsers.length > 0
              ? formState.linkedUsers.map((user) => user.name).join(', ')
              : t('smartPick.justMe')}
          </Text>
          <Pressable
            onPress={() => setIsPeopleSheetOpen(true)}
            className="flex-row items-center gap-1.5 rounded-xl border border-dashed border-gray-400 px-4 py-2.5 cursor-pointer dark:border-gray-500"
          >
            <Plus size={16} color="#9CA3AF" />
            <Text className="font-geist-medium text-sm text-ink dark:text-gray-100">
              {t('smartPick.addPeople')}
            </Text>
          </Pressable>
        </View>
        <SmartPickPeopleSheet
          visible={isPeopleSheetOpen}
          onClose={closePeopleSheet}
          selectedUsers={formState.linkedUsers}
          onAddUser={onAddLinkedUser}
          onRemoveUser={onRemoveLinkedUser}
        />
      </View>

      {/* Matching engine */}
      <View className="gap-3">
        <PageSectionTitle
          className={LABEL_CLASS}
          info={<MatchByInfo />}
          right={
            <View className="flex-row rounded-xl bg-soft p-1 dark:bg-gray-800">
              {(['Personality', 'Vibe'] as const).map((mode) => {
                const isActive = formState.mode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => handleModeChange(mode)}
                    className={`rounded-lg px-3.5 py-1.5 cursor-pointer ${
                      isActive ? 'bg-white dark:bg-gray-900' : ''
                    }`}
                  >
                    <Text
                      className={`font-geist-medium text-sm ${
                        isActive ? 'text-ink dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {mode === 'Personality' ? t('smartPick.modePersonality') : t('smartPick.modeVibes')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          }
        >
          {t('smartPick.engineQuestion')}
        </PageSectionTitle>
        <View className="flex-row flex-wrap gap-2">
          {formState.mode === 'Personality'
            ? SMART_PICK_ENGINES.map((option) => {
                const Icon = ENGINE_ICONS[option.value];
                const isSelected = formState.engine === option.value;
                return (
                  <CategoryChip
                    key={option.value}
                    label={option.name}
                    isSelected={isSelected}
                    onPress={() => onChange({ engine: option.value })}
                    icon={<Icon size={16} color={isSelected ? '#fff' : '#9CA3AF'} />}
                  />
                );
              })
            : SMART_PICK_VIBES.map((vibe) => (
                <CategoryChip
                  key={vibe}
                  label={vibe}
                  isSelected={formState.vibes.includes(vibe)}
                  onPress={() => handleVibeToggle(vibe)}
                />
              ))}
        </View>
        {formState.mode === 'Vibe' ? (
          <Text className="font-geist text-[13px] text-gray-500 dark:text-gray-400">
            {t('smartPick.vibesCounter', {
              count: formState.vibes.length,
              max: MAX_SMART_PICK_VIBES,
            })}
          </Text>
        ) : null}
      </View>

      {/* Previous picks */}
      <Pressable
        onPress={() => router.push('/(app)/(stack)/smart-pick/history' as never)}
        className="flex-row items-center justify-between border-t border-gray-200 pt-4 cursor-pointer dark:border-gray-700"
      >
        <Text className="font-geist text-[13px] text-gray-600 dark:text-gray-300">
          <Text className="font-geist-medium text-ink dark:text-gray-100">
            {t('smartPick.previousPicks')}
          </Text>
          {!isHistoryPending
            ? ` · ${t('smartPick.previousPicksCount', { count: conversations.length })}`
            : ''}
        </Text>
        <ChevronRight size={16} color="#9CA3AF" />
      </Pressable>

      {errorMessage ? (
        <Text className="font-geist text-sm text-error">{errorMessage}</Text>
      ) : null}

      <View className="gap-2">
        {!canSubmit ? (
          <Text className="text-center font-geist text-[13px] text-gray-500 dark:text-gray-400">
            {t('smartPick.chooseMatchHint')}
          </Text>
        ) : null}
        <LocalNotesButton
          label={t('smartPick.getRecommendations')}
          onPress={onSubmit}
          variant="brand"
          isRounded
          disabled={!canSubmit}
          loading={isSubmitting}
        />
      </View>
    </View>
  );
}
