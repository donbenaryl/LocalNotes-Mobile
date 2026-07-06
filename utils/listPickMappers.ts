import type { CreateListItemPayload, ListItemPublic } from '@/http/list-api/types';
import type { FormSubmitData } from '@/components/PageComponents/Profile/ListItemForm';
import type { ListPickDraft } from '@/types/listForm';

export function stableNumericIdFromUuid(uuid: string): number {
  const hex = uuid.replace(/-/g, '');
  let n = 0;
  for (let i = 0; i < hex.length; i++) {
    n = (n * 31 + parseInt(hex[i]!, 16)) >>> 0;
  }
  return n === 0 ? Date.now() : n;
}

export function mapListItemPublicToPickTag(pick: ListItemPublic): ListPickDraft {
  return {
    id: stableNumericIdFromUuid(pick.id),
    serverItemId: pick.id,
    linkedFromLibrary: true,
    businessDisplayName: pick.business_name ?? undefined,
    business: pick.business_id ?? undefined,
    new_tags: pick.tags.map((t) => t.name),
    description: pick.description,
    existingImages: pick.images ?? [],
    ownerPersonalityColor: pick.owner.personality_color,
    owner: {
      id: pick.owner.id,
      name: pick.owner.name,
      profile_image: pick.owner.profile_image,
    },
    ...(pick.location ? { location: pick.location } : {}),
  };
}

export function formSubmitToPickDraft(
  data: FormSubmitData,
  existing?: ListPickDraft,
): ListPickDraft {
  const displayName =
    data.displayName?.trim() ||
    data.unverifiedBusiness?.trim() ||
    existing?.businessDisplayName ||
    'Unnamed place';

  return {
    id: existing?.id ?? Date.now(),
    serverItemId: existing?.serverItemId,
    linkedFromLibrary: existing?.linkedFromLibrary,
    businessDisplayName: displayName,
    existingImages: existing?.existingImages,
    business: data.businessId || undefined,
    unverified_business: data.unverifiedBusiness,
    new_tags: data.tags,
    description: data.description,
    location: data.location,
    newFiles: data.newFiles.length ? data.newFiles : existing?.newFiles,
    ownerPersonalityColor: existing?.ownerPersonalityColor,
    owner: existing?.owner,
  };
}

export function itemsPayloadForApi(items: ListPickDraft[]): CreateListItemPayload[] {
  return items.map(
    ({ business, new_tags, description, unverified_business, serverItemId }) => ({
      ...(serverItemId ? { id: serverItemId } : {}),
      business,
      new_tags,
      description,
      unverified_business,
    }),
  );
}

export function getPickDisplayName(pick: ListPickDraft): string {
  return (
    pick.businessDisplayName?.trim() ||
    pick.unverified_business?.trim() ||
    'Unnamed place'
  );
}

export function getPickSubtitle(pick: ListPickDraft): string {
  const tags = pick.new_tags.length ? pick.new_tags.join(' · ') : '';
  const desc = pick.description?.trim() ?? '';
  if (tags && desc) return `${tags} · "${desc.slice(0, 40)}${desc.length > 40 ? '…' : ''}"`;
  if (tags) return tags;
  if (desc) return `"${desc.slice(0, 60)}${desc.length > 60 ? '…' : ''}"`;
  return '';
}
