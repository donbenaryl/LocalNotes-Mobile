import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BUSINESS_HOME_CAMPAIGN } from '@/constants/businessHomeMock';
import { BusinessHomeCard } from '../ui/BusinessHomeCard';
import { LocalNotesButton } from '@/components/ui/LocalNotesButton';
import { SectionHeading } from '../ui/SectionHeading';
import { MembershipGate } from '../ui/MembershipGate';
import type { BusinessHomeSheetId } from '../sheets/types';

interface CampaignResultsSectionProps {
  isPaidMember: boolean;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function CampaignResultsSection({
  isPaidMember,
  onOpenSheet,
}: CampaignResultsSectionProps) {
  const { t } = useTranslation();

  const showComingSoon = () => {
    Alert.alert(
      t('businessHome.comingSoonTitle'),
      t('businessHome.comingSoonMessage'),
    );
  };

  return (
    <>
      <SectionHeading title={t('businessHome.sections.campaignResults')} />
      <BusinessHomeCard variant="dark">
        <Text className="font-geist-extrabold text-[10.5px] uppercase tracking-wide text-[#FFB37E]">
          {BUSINESS_HOME_CAMPAIGN.status}
        </Text>
        <Text className="mt-1 font-geist-extrabold text-[15px] text-white">
          {BUSINESS_HOME_CAMPAIGN.name}
        </Text>
        <View className="mt-3 flex-row">
          {[
            { value: BUSINESS_HOME_CAMPAIGN.spend, label: t('businessHome.campaign.spend') },
            { value: BUSINESS_HOME_CAMPAIGN.redeemed, label: t('businessHome.campaign.redeemed') },
            { value: BUSINESS_HOME_CAMPAIGN.sales, label: t('businessHome.campaign.sales'), hi: true },
            { value: BUSINESS_HOME_CAMPAIGN.roas, label: t('businessHome.campaign.roas'), hi: true },
          ].map((item, index) => (
            <View
              key={item.label}
              className={`flex-1 ${index > 0 ? 'border-l border-white/10 pl-2.5' : ''}`}
            >
              <Text
                className={`font-geist-extrabold text-lg text-white ${item.hi ? 'text-[#5AD08F]' : ''}`}
              >
                {item.value}
              </Text>
              <Text className="mt-0.5 font-geist-bold text-[9.5px] uppercase text-white/55">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          <LocalNotesButton
            label={t('businessHome.buttons.runAgain')}
            onPress={showComingSoon}
            variant="dark"
            size="sm"
            isRounded
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.editRelaunch')}
            onPress={showComingSoon}
            variant="light"
            size="sm"
            isRounded
            isWidthFull={false}
          />
          <LocalNotesButton
            label={t('businessHome.buttons.receipt')}
            onPress={showComingSoon}
            variant="light"
            size="sm"
            isRounded
            isWidthFull={false}
          />
        </View>
        <MembershipGate isPaidMember={isPaidMember} tier="free">
          <View className="mt-2.5 flex-row flex-wrap gap-1.5">
            <LocalNotesButton
              label={t('businessHome.campaign.viewSnapshot')}
              onPress={showComingSoon}
              variant="ghost"
              size="sm"
              isRounded
              isWidthFull={false}
            />
            <LocalNotesButton
              label={t('businessHome.campaign.campaignSetup')}
              onPress={showComingSoon}
              variant="ghost"
              size="sm"
              isRounded
              isWidthFull={false}
            />
          </View>
          <Text className="mt-2 border-t border-white/10 pt-2 font-geist text-[11px] leading-[1.55] text-white/60">
            <Text className="font-geist-bold text-[#FFB37E]">
              {t('businessHome.campaign.unlockInsights')}
            </Text>
          </Text>
        </MembershipGate>
        <MembershipGate isPaidMember={isPaidMember} tier="paid">
          <Text className="mt-2 border-t border-white/10 pt-2 font-geist text-[11px] leading-[1.55] text-white/60">
            {t('businessHome.campaign.paidNote')}{' '}
            <Text
              onPress={() => onOpenSheet('compare')}
              className="font-geist-extrabold text-[11px] text-[#FFB37E] underline"
            >
              {t('businessHome.campaign.compare')}
            </Text>
          </Text>
        </MembershipGate>
      </BusinessHomeCard>
    </>
  );
}
