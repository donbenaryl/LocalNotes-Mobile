import type {
  ActivityItemDAO,
  ActivityListData,
  ActivityPickData,
  ActivityStoredData,
} from "@/http/home-api/type";
import type { Item, Location } from "@/http/list-api/types";
import { resolveImageUrl } from "@/utils/httpHelpers";

export function formatCityRegion(location?: Partial<Location> | null): string {
  if (!location) return "";
  return [location.city, location.region].filter(Boolean).join(", ");
}

export function getItemPlaceName(item: Item): string {
  return (
    item.business?.name ??
    item.unverified_business?.name ??
    item.others_name ??
    item.description
  );
}

export function getItemImageUrl(item: Item): string | null {
  return resolveImageUrl(item.images?.[0]?.url) ?? resolveImageUrl(item.business?.logo);
}

/** Category plus city, joined the way the feed's pick rows show them. */
export function formatCategoryCity(
  categories: string[] | undefined,
  location?: Partial<Location> | null,
): string {
  return [categories?.[0], location?.city].filter(Boolean).join(" · ");
}

export type ListActivity = ActivityItemDAO & {
  entity: "list";
  data: ActivityListData | ActivityStoredData;
};

export type PickActivity = ActivityItemDAO & {
  entity: "list_item";
  data: ActivityPickData | ActivityStoredData;
};

export function isListActivity(item: ActivityItemDAO): item is ListActivity {
  return item.entity === "list";
}

export function isPickActivity(item: ActivityItemDAO): item is PickActivity {
  return item.entity === "list_item";
}

export function isActivityListData(
  item: ActivityItemDAO,
): item is ActivityItemDAO & { entity: "list"; data: ActivityListData } {
  return item.entity === "list" && Array.isArray((item.data as ActivityListData).items);
}

export function isActivityPickData(
  item: ActivityItemDAO,
): item is ActivityItemDAO & { entity: "list_item"; data: ActivityPickData } {
  return item.entity === "list_item" && "owner" in item.data;
}
