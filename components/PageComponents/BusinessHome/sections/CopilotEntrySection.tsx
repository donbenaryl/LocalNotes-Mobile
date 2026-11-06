import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { copilotHref } from '@/utils/copilotRoutes';
import { AiCreditsMeter } from '../ui/AiCreditsMeter';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { MembershipGate } from '../ui/MembershipGate';

interface CopilotEntrySectionProps {
  /** Selected branch's paid status. A free branch shows no entry point at all. */
  isPaidMember: boolean;
}

const EXAMPLES = ['example1', 'example2'] as const;

/** "Ask Copilot" card: resumes the latest conversation; the pills start a new chat with a question. */
export function CopilotEntrySection({ isPaidMember }: CopilotEntrySectionProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <MembershipGate isPaidMember={isPaidMember} tier="paid">
      <BusinessHomeCard className="mt-3">
        <Text className="font-geist-extrabold text-base text-ink dark:text-gray-100">
          {`✦ ${t('businessHome.copilot.entry.title')}`}
        </Text>
        <Text className="mt-1 font-geist text-[13px] leading-[1.5] text-gray-600 dark:text-gray-400">
          {t('businessHome.copilot.entry.body')}
        </Text>
        <View className="mt-3 flex-row flex-wrap gap-1.5">
          {EXAMPLES.map((id) => {
            const question = t(`businessHome.copilot.entry.${id}`);
            return (
              <Pressable
                key={id}
                onPress={() => router.push(copilotHref({ q: question }))}
                accessibilityRole="button"
                className="rounded-full border border-gray-200 px-3 py-2 active:opacity-70 dark:border-gray-600"
              >
                <Text className="font-geist-bold text-xs text-ink dark:text-gray-100">
                  {question}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-3">
          <LocalNotesButton
            label={t('businessHome.copilot.entry.resume')}
            onPress={() => router.push(copilotHref())}
            variant="dark"
            size="xs"
          />
        </View>
        <AiCreditsMeter variant="compact" isPaid={isPaidMember} className="mt-2" />
      </BusinessHomeCard>
    </MembershipGate>
  );
}
