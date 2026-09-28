import type { BusinessTypeDAO } from '@/http/business-api/types';

export function findBusinessType(
  types: BusinessTypeDAO[],
  name: string | null | undefined,
): BusinessTypeDAO | undefined {
  const needle = name?.trim().toLowerCase();
  if (!needle) return undefined;
  return types.find((type) => type.name.trim().toLowerCase() === needle);
}
