import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { ListCardDetailed } from "@/components/ui/ListCardDetailed";
import { PicksMasonryGrid } from "@/components/ui/PicksMasonryGrid";
import { BusinessCard } from "@/components/PageComponents/Business/BusinessCard";
import { PeopleCard } from "@/components/PageComponents/People/PeopleCard";
import type { SearchMapMarker } from "@/utils/searchMapMarkers";

/** Modal drag handle (pt-3 pb-3) + sheet bottom padding (pb-10). */
const SHEET_CHROME = 12 + 12 + 40;

interface SearchMapPinSheetProps {
  visible: boolean;
  onClose: () => void;
  marker: SearchMapMarker | null;
}

export function SearchMapPinSheet({
  visible,
  onClose,
  marker,
}: SearchMapPinSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollMaxHeight = height - insets.top - SHEET_CHROME;

  const countLabel = (() => {
    if (!marker) return "";
    const count = marker.items.length;
    switch (marker.kind) {
      case "list":
        return t("search.map.pinSheet.lists", { count });
      case "pick":
        return t("search.map.pinSheet.picks", { count });
      case "person":
        return t("search.map.pinSheet.people", { count });
      case "business":
        return t("search.map.pinSheet.places", { count });
    }
  })();

  const locationLabel =
    marker?.subtitle?.trim() || marker?.title?.trim() || undefined;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      withCloseIcon={false}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: scrollMaxHeight }}
        className="-mx-4"
        contentContainerClassName="gap-3 px-4 pb-2"
      >
        {marker ? (
          <View className="gap-1 px-0 pb-1">
            {locationLabel ? (
              <Text
                className="font-geist-bold text-base text-ink dark:text-gray-100"
                numberOfLines={2}
              >
                {locationLabel}
              </Text>
            ) : null}
            <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
              {countLabel}
            </Text>
          </View>
        ) : null}

        {marker?.kind === "list"
          ? marker.items.map((list) => (
              <ListCardDetailed key={list.id} list={list} />
            ))
          : null}

        {marker?.kind === "pick" ? (
          <PicksMasonryGrid picks={marker.items} readOnly />
        ) : null}

        {marker?.kind === "person"
          ? marker.items.map((person) => (
              <PeopleCard key={person.id} data={person} />
            ))
          : null}

        {marker?.kind === "business"
          ? marker.items.map((business) => (
              <BusinessCard key={business.id} data={business} />
            ))
          : null}
      </ScrollView>
    </Modal>
  );
}
