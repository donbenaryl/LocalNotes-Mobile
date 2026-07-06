import type { BusinessBranchDAO, BusinessLocation } from "@/http/business-api/types";
import type { NoteDAO } from "@/http/notes-api/types";

export interface OfferCardItem {
  id: string;
  businessId?: string;
  businessName: string;
  businessLogoUrl?: string;
  isBusinessFollowed?: boolean;
  postedAt: string;
  expiresAt?: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  businessBranches?: string[];
  categories?: string[];
  others_name?: string;
  views: number;
  likes: number;
  shares: number;
}

function formatBusinessLocation(location: BusinessLocation): string {
  const parts = [
    location.street_address,
    location.city,
    location.region,
    location.postal_code,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown location";
}

function formatBranchLabel(branch: BusinessBranchDAO): string {
  const locationLabel = formatBusinessLocation(branch.location);
  return `${locationLabel} • ${branch.name}`;
}

export function mapNoteDaoToOfferItem(note: NoteDAO): OfferCardItem {
  const image = note.media.find((item) => item.media_type === "image");
  const video = note.media.find((item) => item.media_type === "video");

  return {
    id: note.id,
    businessId: note.business.id,
    title: note.title,
    businessName: note.business.name,
    businessLogoUrl: note.business.logo,
    isBusinessFollowed: note.business.is_followed ?? false,
    postedAt: note.created_at,
    expiresAt: note.expires_at ?? undefined,
    content: note.description ?? undefined,
    imageUrl: image?.url,
    videoUrl: video?.url,
    businessBranches:
      note.business.branches.length > 0
        ? note.business.branches.map(formatBranchLabel)
        : note.business.location
          ? [formatBusinessLocation(note.business.location)]
          : undefined,
    categories: note.categories.map((category) => category.name),
    views: note.view_count ?? 0,
    likes: note.like_count ?? 0,
    shares: note.share_count ?? 0,
    others_name: note.categories.find(
      (category) => category.name.toLowerCase() === "others",
    )?.others_name,
  };
}
