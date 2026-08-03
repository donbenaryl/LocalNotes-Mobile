import { useMemo, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { PickCard } from "@/components/PageComponents/Profile/PickCard";
import type { ListItemPublic } from "@/http/list-api/types";

interface PicksMasonryGridProps {
  picks: ListItemPublic[];
  onRefresh?: () => void;
  readOnly?: boolean;
}

const COLUMN_GAP = 12;
const HERO_ASPECT_RATIO = 12 / 16; // matches PickCard's CardHero aspect-[16/12]
const BODY_BASE_HEIGHT = 24; // p-3 vertical padding
const TITLE_ROW_HEIGHT = 22;
const LOCATION_ROW_HEIGHT = 16;
const DESCRIPTION_ROW_HEIGHT = 16;
const CATEGORIES_ROW_HEIGHT = 26;
const TAGS_ROW_HEIGHT = 26;
const OWNER_ROW_HEIGHT = 30;
const MATCH_OVERLAY_PADDING = 40; // pt-10 applied when there's no hero image

/**
 * Estimates a pick's rendered card height so it can be assigned to the shorter
 * masonry column up front — PickCard's image and text content mean no two cards
 * are the same height, which real onLayout measurement can't resolve before paint.
 */
function estimatePickHeight(item: ListItemPublic, columnWidth: number): number {
  const hasImage = (item.images?.length ?? 0) > 0;
  let height = hasImage ? columnWidth * HERO_ASPECT_RATIO : 0;

  let bodyHeight = BODY_BASE_HEIGHT;
  if (!hasImage && item.business_name) bodyHeight += TITLE_ROW_HEIGHT;
  if (item.location) bodyHeight += LOCATION_ROW_HEIGHT;
  if (item.description) bodyHeight += DESCRIPTION_ROW_HEIGHT;
  if (item.categories.length > 0) bodyHeight += CATEGORIES_ROW_HEIGHT;
  if (!hasImage && item.tags.length > 0) bodyHeight += TAGS_ROW_HEIGHT;
  if (item.owner || item.list_usage_count > 0) bodyHeight += OWNER_ROW_HEIGHT;
  if (!hasImage && !item.is_owner) bodyHeight += MATCH_OVERLAY_PADDING;

  return height + bodyHeight;
}

/** Two-column Pinterest-style grid: assigns each pick to the currently shorter column. */
export function PicksMasonryGrid({ picks, onRefresh, readOnly }: PicksMasonryGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  const { leftColumn, rightColumn } = useMemo(() => {
    const columnWidth = containerWidth > 0 ? (containerWidth - COLUMN_GAP) / 2 : 160;
    const left: ListItemPublic[] = [];
    const right: ListItemPublic[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    for (const item of picks) {
      const estimatedHeight = estimatePickHeight(item, columnWidth);
      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += estimatedHeight;
      } else {
        right.push(item);
        rightHeight += estimatedHeight;
      }
    }

    return { leftColumn: left, rightColumn: right };
  }, [picks, containerWidth]);

  return (
    <View className="flex-row gap-3" onLayout={handleLayout}>
      <View className="flex-1 gap-3">
        {leftColumn.map((pick) => (
          <PickCard key={pick.id} data={pick} onRefresh={onRefresh} readOnly={readOnly} />
        ))}
      </View>
      <View className="flex-1 gap-3">
        {rightColumn.map((pick) => (
          <PickCard key={pick.id} data={pick} onRefresh={onRefresh} readOnly={readOnly} />
        ))}
      </View>
    </View>
  );
}
