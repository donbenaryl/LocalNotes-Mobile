import { InsightSummarySection } from './InsightSummarySection';
import { ProfileHealthSection } from './FreeCampaignSections';

interface BusinessInsightsSectionsProps {
  isPaidMember: boolean;
}

export function BusinessInsightsSections({
  isPaidMember,
}: BusinessInsightsSectionsProps) {
  return (
    <>
      <InsightSummarySection isPaidMember={isPaidMember} />
      <ProfileHealthSection isPaidMember={isPaidMember} />
    </>
  );
}
