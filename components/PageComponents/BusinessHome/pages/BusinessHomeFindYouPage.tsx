import { useTranslation } from 'react-i18next';
import { HowPeopleFindYouSection } from '../sections/HowPeopleFindYouSection';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeFindYouPageProps {
  onBack: () => void;
  periodLabel: string;
}

export function BusinessHomeFindYouPage({
  onBack,
  periodLabel,
}: BusinessHomeFindYouPageProps) {
  const { t } = useTranslation();

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.howPeopleFindYou')}
      onBack={onBack}
    >
      <HowPeopleFindYouSection periodLabel={periodLabel} />
    </BusinessHomeDetailShell>
  );
}
