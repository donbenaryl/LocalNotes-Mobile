import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUserCoordinates } from '@/hooks/useUserCoordinates';
import { useSmartPickWebResults } from '@/hooks/useSmartPickWebResults';
import { dedupeSmartPickResults, isStretchConversation } from '@/utils/smartPick';
import type { DetailedConversation } from '@/http/smart-pick-api/types';
import { SmartPickSummaryBar } from './SmartPickSummaryBar';
import { SmartPickHero } from './SmartPickHero';
import { SmartPickBackupCard } from './SmartPickBackupCard';
import { SmartPickWebResultCard } from './SmartPickWebResultCard';
import { SmartPickNoResults } from './SmartPickNoResults';

interface SmartPickResultsProps {
  conversation: DetailedConversation;
  onBack: () => void;
}

export function SmartPickResults({ conversation, onBack }: SmartPickResultsProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { coordinates } = useUserCoordinates();
  const { trigger, webResults, isLoading: isWebLoading } = useSmartPickWebResults(conversation.id);

  const isStretch = isStretchConversation(conversation);
  const sorted = dedupeSmartPickResults(conversation.results);
  const [primary, ...rest] = sorted;

  // Kick off the "around the web" search once we know where the user is —
  // mirrors the web app firing this right after a successful create.
  useEffect(() => {
    if (coordinates) trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id, coordinates?.latitude, coordinates?.longitude]);

  return (
    <View className="flex-1">
      <SmartPickSummaryBar messages={conversation.messages} isStretch={isStretch} onBack={onBack} />

      <View className="gap-5 px-4 pb-10 pt-4">
        {primary ? (
          <>
            <View className="gap-1">
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`h-[5px] w-[5px] rotate-45 ${isStretch ? 'bg-connector' : 'bg-brand'}`}
                />
                <Text
                  className={`font-geist-bold text-[10.5px] uppercase tracking-[0.14em] ${
                    isStretch ? 'text-connector' : 'text-brand-dark'
                  }`}
                >
                  {t(isStretch ? 'smartPick.outsideUsualEyebrow' : 'smartPick.forYouEyebrow')}
                </Text>
              </View>
              <Text className="font-geist-semibold text-[21px] leading-6 text-ink dark:text-gray-100">
                {conversation.result_label}
              </Text>
            </View>

            <SmartPickHero result={primary} isStretch={isStretch} />

            {rest.length > 0 ? (
              <View className="gap-2.5">
                <Text className="font-geist-semibold text-[10.5px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                  {t(isStretch ? 'smartPick.orTheseStretch' : 'smartPick.orTheseStandard')}
                </Text>
                {rest.map((result) => (
                  <View key={result.id} className="gap-2.5">
                    <SmartPickBackupCard
                      result={result}
                      isStretch={isStretch}
                      isExpanded={expandedId === result.id}
                      onPress={() =>
                        setExpandedId((current) => (current === result.id ? null : result.id))
                      }
                    />
                    {expandedId === result.id ? (
                      <SmartPickHero
                        result={result}
                        isStretch={isStretch}
                        eyebrow={t('smartPick.differentVibe')}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <SmartPickNoResults
            resultLabel={conversation.result_label}
            isStretch={isStretch}
            onTryAgain={onBack}
          />
        )}

        {/* "Around the web" — places near the user not yet curated in LocalNotes. */}
        <View className="gap-2.5">
          <Text className="font-geist-semibold text-[10.5px] uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            {t('smartPick.aroundTheWeb')}
          </Text>

          {!coordinates ? (
            <View className="flex-row items-center gap-2 rounded-2xl bg-soft px-4 py-3.5 dark:bg-gray-800">
              <MapPin size={16} color="#9CA3AF" />
              <Text className="flex-1 font-geist text-[12.5px] text-gray-500 dark:text-gray-400">
                {t('smartPick.enableLocation')}
              </Text>
            </View>
          ) : isWebLoading ? (
            <View className="gap-2.5">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </View>
          ) : webResults.length > 0 ? (
            <View className="gap-2.5">
              {webResults.map((webResult, index) => (
                <SmartPickWebResultCard key={`${webResult.name}-${index}`} webResult={webResult} />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
