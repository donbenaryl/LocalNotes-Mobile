import { useTranslation } from 'react-i18next';
import type { BusinessHomeLocationRow } from '@/constants/businessHomeMock';
import { LocationsSection } from '../sections/LocationsSection';
import type { BusinessHomeSheetId } from '../sheets/types';
import { BusinessHomeDetailShell } from './BusinessHomeDetailShell';

interface BusinessHomeLocationsPageProps {
  locationRows: BusinessHomeLocationRow[];
  isPaidMember: boolean;
  onBack: () => void;
  onOpenSheet: (id: BusinessHomeSheetId) => void;
}

export function BusinessHomeLocationsPage({
  locationRows,
  isPaidMember,
  onBack,
  onOpenSheet,
}: BusinessHomeLocationsPageProps) {
  const { t } = useTranslation();

  return (
    <BusinessHomeDetailShell
      title={t('businessHome.pages.locations')}
      onBack={onBack}
    >
      <LocationsSection
        locationRows={locationRows}
        isPaidMember={isPaidMember}
        onOpenSheet={onOpenSheet}
      />
    </BusinessHomeDetailShell>
  );
}
