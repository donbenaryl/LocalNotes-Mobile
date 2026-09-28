import type {
  BusinessBranchDAO,
  BusinessItemDAO,
  BusinessTypeDAO,
  BusinessTypeRequirementDAO,
} from '@/http/business-api/types';
import { findBusinessType } from '@/utils/businessTypes';

export type ProfileHealthGroup =
  | 'businessInfo'
  | 'businessType'
  | 'contact'
  | 'website'
  | 'hours'
  | 'location'
  | 'photo'
  | 'importantInfo';

export type ProfileHealthGap = {
  group: ProfileHealthGroup;
  /** Labels of the missing type-specific details (importantInfo only). */
  missing?: string[];
};

export type ProfileHealthResult = {
  score: number;
  gaps: ProfileHealthGap[];
};

const GROUP_COUNT = 8;

function filled(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

function hasOpeningHours(branch?: BusinessBranchDAO): boolean {
  return Object.values(branch?.opening_hours ?? {}).some(
    (day) => filled(day?.open) && filled(day?.close),
  );
}

function hasLocation(branch?: BusinessBranchDAO): boolean {
  return filled(branch?.location?.street_address) || filled(branch?.location?.city);
}

export function gradeBusinessProfile(
  business: BusinessItemDAO | null | undefined,
  branch: BusinessBranchDAO | undefined,
  types: BusinessTypeDAO[],
): ProfileHealthResult {
  if (!business) return { score: 0, gaps: [] };

  const catalogType = findBusinessType(types, business.business_type);
  const requirements: BusinessTypeRequirementDAO[] = catalogType?.requirements ?? [];
  const details = business.profile_details ?? {};
  const missingDetails = requirements.filter(({ key }) => !filled(details[key]));

  const groups: { group: ProfileHealthGroup; value: number; missing?: string[] }[] = [
    {
      group: 'businessInfo',
      value: (Number(filled(business.name)) + Number(filled(business.bio))) / 2,
    },
    { group: 'businessType', value: catalogType ? 1 : 0 },
    {
      group: 'contact',
      value: filled(business.phone_number) || filled(business.contact_email) ? 1 : 0,
    },
    { group: 'website', value: filled(business.website) ? 1 : 0 },
    { group: 'hours', value: hasOpeningHours(branch) ? 1 : 0 },
    { group: 'location', value: hasLocation(branch) ? 1 : 0 },
    { group: 'photo', value: filled(business.logo) ? 1 : 0 },
    {
      group: 'importantInfo',
      value:
        requirements.length > 0
          ? (requirements.length - missingDetails.length) / requirements.length
          : 0,
      missing: missingDetails.map(({ label }) => label),
    },
  ];

  const sum = groups.reduce((total, { value }) => total + value, 0);
  return {
    score: Math.round((sum / GROUP_COUNT) * 100),
    gaps: groups
      .filter(({ value }) => value < 1)
      .map(({ group, missing }) =>
        group === 'importantInfo' ? { group, missing } : { group },
      ),
  };
}
