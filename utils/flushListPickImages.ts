import listService from '@/http/list-api/list.service';
import { DEFAULT_MAX_IMAGE_FILES } from '@/components/ui/ImageUploadField';
import type { Item } from '@/http/list-api/types';
import type { ListPickDraft } from '@/types/listForm';

function resolveApiRowForDraft(
  apiItems: Item[],
  snapshot: ListPickDraft[],
  index: number,
  draft: ListPickDraft,
): Item | undefined {
  if (draft.serverItemId) {
    return apiItems.find((item) => item.id === draft.serverItemId);
  }

  const newDraftsBefore = snapshot
    .slice(0, index)
    .filter((item) => !item.serverItemId).length;
  const newApiItems = apiItems.filter(
    (item) => !snapshot.some((s) => s.serverItemId === item.id),
  );
  return newApiItems[newDraftsBefore];
}

export async function flushListPickImages(
  apiItems: Item[],
  snapshot: ListPickDraft[],
): Promise<void> {
  for (let i = 0; i < snapshot.length; i++) {
    const draft = snapshot[i]!;
    const files = draft.newFiles ?? [];
    if (!files.length) continue;

    const row = resolveApiRowForDraft(apiItems, snapshot, i, draft);
    const serverId = row?.id;
    if (!serverId) continue;

    let onServer = row.images?.length ?? 0;

    for (const file of files) {
      if (onServer >= DEFAULT_MAX_IMAGE_FILES) break;
      const { error } = await listService.uploadListItemImage(file, serverId);
      if (!error) {
        onServer += 1;
      }
    }
  }
}
