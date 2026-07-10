import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { CategoryChip } from '@/components/ui/CategoryChip';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { useSmartPickHistory } from '@/hooks/useSmartPickHistory';
import { SMART_PICK_ENGINES, SMART_PICK_OCCASIONS, SMART_PICK_TIMES, SMART_PICK_VIBES } from '@/constants/smartPick';
import { EngineCard } from './EngineCard';
import type { SmartPickFormState, SmartPickMode } from '../types';
import { PageSectionTitle } from '@/components/ui/PageSectionTitle';
import { UserSearchInput } from '@/components/ui/UserSearchInput';
import type { searchUserDAO } from '@/http/account-api/types';

interface SmartPickFormProps {
  formState: SmartPickFormState;
  onChange: (patch: Partial<SmartPickFormState>) => void;
  onAddLinkedUser: (user: searchUserDAO) => void;
  onRemoveLinkedUser: (userId: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export function SmartPickForm({
  formState,
  onChange,
  onAddLinkedUser,
  onRemoveLinkedUser,
  onSubmit,
  onSkip,
  isSubmitting,
  errorMessage,
}: SmartPickFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { conversations, isPending: isHistoryPending } = useSmartPickHistory();

  const canSubmit = Boolean(
    formState.occasion &&
      formState.timeOfDay &&
      (formState.mode === 'Personality' ? formState.engine : formState.vibe),
  );

  const handleModeChange = (mode: SmartPickMode) => {
    if (mode === formState.mode) return;
    onChange({
      mode,
      engine: mode === 'Personality' ? formState.engine : null,
      vibe: mode === 'Vibe' ? formState.vibe : null,
    });
  };

  return (
    <View className="gap-6 px-4 pb-10 pt-4 bg-page dark:bg-gray-900">
      {/* Welcome banner */}
      <View className="overflow-hidden rounded-[18px]">
        <LinearGradient
          colors={['#FF6B1A', '#c2410c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 18 }}
        >
          <View className="mb-2 flex-row items-center gap-1.5">
            <Sparkles size={12} color="#fff" />
            <Text className="font-geist-medium text-sm uppercase tracking-[0.16em] text-white">
              {t('smartPick.welcomeEyebrow')}
            </Text>
          </View>
          <Text className="font-geist-semibold text-2xl mt-2 leading-6 text-white">
            {t('smartPick.welcomeTitle')}{' '}
            <Text className="font-fraunces italic">{t('smartPick.welcomeTitleAccent')}</Text>
          </Text>
          <Text className="mt-2 font-geist leading-5 text-white/85">
            {t('smartPick.welcomeDetail')}
          </Text>
        </LinearGradient>
      </View>

      {/* Occasion */}
      <View className="gap-3">
        <PageSectionTitle>
          {t('smartPick.occasionQuestion')}
        </PageSectionTitle>
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
        <PageSectionTitle>
          {t('smartPick.timeQuestion')}
        </PageSectionTitle>
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

      {/* Matching engine */}
      <View className="gap-3">
        <Text className="font-geist-semibold text-sm text-ink dark:text-gray-100">
          {t('smartPick.engineQuestion')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <CategoryChip
            label={t('smartPick.modePersonality')}
            isSelected={formState.mode === 'Personality'}
            onPress={() => handleModeChange('Personality')}
          />
          <CategoryChip
            label={t('smartPick.modeVibes')}
            isSelected={formState.mode === 'Vibe'}
            onPress={() => handleModeChange('Vibe')}
          />
        </View>
        {formState.mode === 'Personality' ? (
          <View className="gap-2.5">
            {SMART_PICK_ENGINES.map((option) => (
              <EngineCard
                key={option.value}
                option={option}
                isSelected={formState.engine === option.value}
                onPress={() => onChange({ engine: option.value })}
              />
            ))}
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {SMART_PICK_VIBES.map((vibe) => (
              <CategoryChip
                key={vibe}
                label={vibe}
                isSelected={formState.vibe === vibe}
                onPress={() => onChange({ vibe })}
              />
            ))}
          </View>
        )}
      </View>

      {/* Link profile (optional) */}
      <View className="gap-2.5">
        <View className="flex-row items-baseline gap-1.5">
          <PageSectionTitle>
            {t('smartPick.linkProfileLabel')}
          </PageSectionTitle>
          <Text className="font-geist text-[11px] text-gray-400 dark:text-gray-500">
            {t('common.optional')}
          </Text>
        </View>
        <Text className="font-fraunces text-[11.5px] italic leading-[1.45] text-gray-400 dark:text-gray-500">
          {t('smartPick.linkProfileHelper')}
        </Text>
        <UserSearchInput
          selectedUsers={formState.linkedUsers}
          onAddUser={onAddLinkedUser}
          onRemoveUser={onRemoveLinkedUser}
          className="gap-2"
          placeholderKey="smartPick.linkProfileSearchPlaceholder"
          showSelectedLabel={false}
        />
      </View>

      {/* Previous picks */}
      <Pressable
        onPress={() => router.push('/(app)/(stack)/smart-pick/history' as never)}
        className="flex-row items-center justify-between rounded-2xl bg-soft px-4 py-3.5 cursor-pointer dark:bg-gray-800"
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

      {/* CTA row. Not position:absolute-sticky like the mockup — this tab
          already sits under the floating bottom nav bar (GuardedFooter),
          and stacking a second absolute footer on top of that risked
          overlapping it. Generous bottom padding above keeps it clear. */}
      <View className="flex-row gap-2">
        <LocalNotesButton
          label={t('smartPick.skip')}
          onPress={onSkip}
          variant="light"
          isRounded
          isWidthFull={false}
          className="px-5"
        />
        <LocalNotesButton
          label={t('smartPick.getRecommendations')}
          onPress={onSubmit}
          variant="brand"
          isRounded
          disabled={!canSubmit}
          loading={isSubmitting}
          className="flex-1"
        />
      </View>
    </View>
  );
}
