import type {
  CreateListItemPayload,
  Item,
  ListItemDAO,
  ListItemPublic,
} from '@/http/list-api/types';
import type { FormSubmitData } from '@/components/PageComponents/Profile/ListItemForm';
import type {
  ListFormCategory,
  ListFormData,
  ListPickDraft,
  ShareOption,
} from '@/types/listForm';
import type { ConversationResult, WebResult } from '@/http/smart-pick-api/types';

function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function normalizeShareOption(privacy: string): ShareOption {
  switch (privacy) {
    case 'Public':
      return 'Public';
    case 'Friends':
      return 'Friends';
    case 'Private':
      return 'Private';
    case 'Specific People':
      return 'Specific People';
    default:
      return 'Public';
  }
}

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
    // No category catalog available here, and this pick already has a serverItemId
    // (so its categories aren't resubmitted) — id is just a display placeholder.
    categories: pick.categories.map((name) => ({ id: '', name })),
    others_name: pick.others_name ?? undefined,
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
    categories: data.categoryObjects,
    others_name: data.othersName,
    description: data.description,
    location: data.location,
    newFiles: data.newFiles.length ? data.newFiles : existing?.newFiles,
    ownerPersonalityColor: existing?.ownerPersonalityColor,
    owner: existing?.owner,
  };
}

export function itemsPayloadForApi(items: ListPickDraft[]): CreateListItemPayload[] {
  return items.map(
    ({ business, new_tags, categories, others_name, description, unverified_business, serverItemId }) => ({
      ...(serverItemId ? { id: serverItemId } : {}),
      business,
      new_tags,
      description,
      unverified_business,
      // A pick already linked to the server keeps its own categories — only a
      // brand-new pick needs to submit them here.
      ...(serverItemId ? {} : { categories: categories?.map((c) => c.id) ?? [], others_name }),
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

function matchCategoryNames(
  names: string[],
  categoryCatalog: ListFormCategory[],
): ListFormCategory[] {
  return names
    .map((name) =>
      categoryCatalog.find(
        (category) =>
          category.name.toLowerCase() === name.toLowerCase() ||
          category.id === name,
      ),
    )
    .filter((category): category is ListFormCategory => category != null);
}

export function mapApiItemToPickDraft(
  item: Item,
  categoryCatalog: ListFormCategory[] = [],
): ListPickDraft {
  return {
    id: stableNumericIdFromUuid(String(item.id)),
    serverItemId: item.id,
    linkedFromLibrary: true,
    existingImages: item.images ?? [],
    business: item.business?.id,
    businessDisplayName:
      item.business?.name ?? item.unverified_business?.name ?? undefined,
    new_tags: item.tags.map((tag) => tag.name),
    categories: matchCategoryNames(item.categories ?? [], categoryCatalog),
    others_name: item.others_name ?? undefined,
    description: item.description,
    unverified_business: item.unverified_business?.name,
    ...(item.location ? { location: item.location } : {}),
    ...(item.owner
      ? {
          owner: {
            id: item.owner.id,
            name: item.owner.name,
            profile_image: item.owner.profile_image,
          },
          ownerPersonalityColor: item.owner.personality_color,
        }
      : {}),
  };
}

/** Maps a Smart Pick recommendation into a draft the list-creation form can prefill from. */
export function mapSmartPickResultToPickDraft(result: ConversationResult): ListPickDraft {
  const pick = result.pick;

  return {
    id: stableNumericIdFromUuid(result.id),
    business: pick?.business?.id,
    businessDisplayName: pick?.business?.name ?? pick?.unverified_business?.name ?? undefined,
    unverified_business: pick?.unverified_business?.name,
    new_tags: pick?.tags.map((tag) => tag.name) ?? [],
    description: pick?.description ?? result.description ?? '',
    existingImages: pick?.images ?? [],
    ...(pick?.location ? { location: pick.location } : {}),
    ...(pick?.user
      ? {
          owner: {
            id: pick.user.id,
            name: pick.user.name,
            profile_image: pick.user.profile_image_url,
          },
          ownerPersonalityColor: pick.user.personality_color as Record<string, number> | null,
        }
      : {}),
  };
}

/** Maps an "around the web" Smart Pick suggestion (not yet in LocalNotes) into a new pick draft. */
export function mapWebResultToPickDraft(webResult: WebResult): ListPickDraft {
  return {
    id: Date.now(),
    unverified_business: webResult.name,
    businessDisplayName: webResult.name,
    new_tags: [],
    description: webResult.description ?? webResult.why_it_fits ?? '',
    existingImages: webResult.image_url ? [{ id: webResult.name, url: webResult.image_url }] : [],
  };
}

export function mapListItemDaoToFormData(
  list: ListItemDAO,
  categoryCatalog: ListFormCategory[],
): ListFormData {
  const matchedCategories = matchCategoryNames(list.categories ?? [], categoryCatalog);

  return {
    name: list.name,
    location: list.location,
    categories: matchedCategories,
    items: (list.items ?? []).map((item) => mapApiItemToPickDraft(item, categoryCatalog)),
    notes: stripHtmlTags(list.notes ?? ''),
    others_name: list.others_name ?? '',
    shareOption: normalizeShareOption(list.privacy),
    allowComments: list.others_can_comment,
    allowShare: list.others_can_share,
    specificUsers: list.shared_with ?? [],
  };
}

export function getPickSubtitle(pick: ListPickDraft): string {
  const tags = pick.new_tags.length ? pick.new_tags.join(' · ') : '';
  const desc = pick.description?.trim() ?? '';
  if (tags && desc) return `${tags} · "${desc.slice(0, 40)}${desc.length > 40 ? '…' : ''}"`;
  if (tags) return tags;
  if (desc) return `"${desc.slice(0, 60)}${desc.length > 60 ? '…' : ''}"`;
  return '';
}
