export type PushPreviewType = 'list' | 'pick' | 'offer' | 'note';

export interface RichPushData {
  brand?: string;
  notificationType?: string;
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string | null;
  previewType?: PushPreviewType | null;
  previewTitle?: string | null;
  previewSubtitle?: string | null;
  previewImageUrl?: string | null;
  deepLink?: string | null;
}

export function parseRichPushData(raw: unknown): RichPushData {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as RichPushData;
}
