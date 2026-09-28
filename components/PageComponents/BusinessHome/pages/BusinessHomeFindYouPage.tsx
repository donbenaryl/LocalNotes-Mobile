import { useTranslation } from 'react-i18next';
import type { BusinessHomeDiscovery } from '@/hooks/useBusinessHomeData';
import { HowPeopleFindYouSection } from '../sections/HowPeopleFindYouSection';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeFindYouPageProps {
  onBack: () => void;
  periodLabel: string;
  discovery: BusinessHomeDiscovery;
  onOpenSpotlight: () => void;
}

export function BusinessHomeFindYouPage({
  onBack,
  periodLabel,
  discovery,
  onOpenSpotlight,
}: BusinessHomeFindYouPageProps) {
  const { t } = useTranslation();

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.howPeopleFindYou')}
      onBack={onBack}
    >
      <HowPeopleFindYouSection
        periodLabel={periodLabel}
        discovery={discovery}
        onOpenSpotlight={onOpenSpotlight}
      />
    </BusinessHomeDetailShell>
  );
}
