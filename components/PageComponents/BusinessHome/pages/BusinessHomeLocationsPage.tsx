import { useTranslation } from 'react-i18next';
import type { BusinessHomeLocationRow } from '@/constants/businessHomeMock';
import { LocationsSection } from '../sections/LocationsSection';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeLocationsPageProps {
  locationRows: BusinessHomeLocationRow[];
  isPaidMember: boolean;
  onBack: () => void;
}

export function BusinessHomeLocationsPage({
  locationRows,
  isPaidMember,
  onBack,
}: BusinessHomeLocationsPageProps) {
  const { t } = useTranslation();

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.locations')}
      onBack={onBack}
    >
      <LocationsSection locationRows={locationRows} isPaidMember={isPaidMember} />
    </BusinessHomeDetailShell>
  );
}
