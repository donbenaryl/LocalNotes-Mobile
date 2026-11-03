import { InsightSummarySection } from './InsightSummarySection';
import { ProfileHealthSection } from './FreeCampaignSections';
import type { BusinessHomeToplineProps } from '../BusinessHomeTopline';

interface BusinessInsightsSectionsProps {
  isPaidMember: boolean;
  dateFrom: string;
  dateTo: string;
  topline: BusinessHomeToplineProps;
}

export function BusinessInsightsSections({
  isPaidMember,
  dateFrom,
  dateTo,
  topline,
}: BusinessInsightsSectionsProps) {
  return (
    <>
      <InsightSummarySection
        isPaidMember={isPaidMember}
        dateFrom={dateFrom}
        dateTo={dateTo}
        topline={topline}
      />
      <ProfileHealthSection isPaidMember={isPaidMember} />
    </>
  );
}
