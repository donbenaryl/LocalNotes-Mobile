import { useTranslation } from 'react-i18next';
import { CampaignResultsSection } from '../sections/CampaignResultsSection';
import type { BusinessHomeSheetId } from '../sheets/types';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeCampaignPageProps {
  isPaidMember: boolean;
  onBack: () => void;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function BusinessHomeCampaignPage({
  isPaidMember,
  onBack,
  onOpenSheet,
}: BusinessHomeCampaignPageProps) {
  const { t } = useTranslation();

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.campaign')}
      onBack={onBack}
    >
      <CampaignResultsSection
        isPaidMember={isPaidMember}
        onOpenSheet={onOpenSheet}
      />
    </BusinessHomeDetailShell>
  );
}
