import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Clock, Search, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "nativewind";
import { useKeyboardState } from "react-native-keyboard-controller";
import { PickPreviewImage } from "@/components/ui/PickPreviewImage";
import type {
  SearchFollowPick,
  SearchSuggestion,
} from "@/constants/searchSuggestions";

const MIN_DROPDOWN_HEIGHT = 200;

type SearchFocusDropdownProps = {
  visible: boolean;
  recentQueries: string[];
  suggestions: SearchSuggestion[];
  followingPicks: SearchFollowPick[];
  onSelect: (query: string) => void;
  onRemoveRecent: (query: string) => void;
  onClearRecent: () => void;
  onSelectFollowPick: (pick: SearchFollowPick) => void;
  onDismiss: () => void;
};

function reasonForSource(
  t: (key: string, options?: Record<string, string>) => string,
  row: SearchSuggestion,
): string {
  switch (row.source) {
    case "vibe_answers":
      return t("search.fromYourVibeAnswers");
    case "vibe_often":
      return t("search.vibeYouUseOften");
    case "popular_city":
      return t("search.popularIn", { city: row.city ?? "" });
    case "trending":
      return t("search.trendingNow");
    case "your_searches":
      return t("search.fromYourSearches");
    default:
      return "";
  }
}

export function SearchFocusDropdown({
  visible,
  recentQueries,
  suggestions,
  followingPicks,
  onSelect,
  onRemoveRecent,
  onClearRecent,
  onSelectFollowPick,
  onDismiss,
}: SearchFocusDropdownProps) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardState((s) => s.height);
  const hostRef = useRef<View>(null);
  const [dropdownTopY, setDropdownTopY] = useState(0);
  const iconColor = colorScheme === "dark" ? "#A79E92" : "#6C727F";
  const mutedIcon = colorScheme === "dark" ? "#8F877C" : "#9EA4AF";

  const measureTop = useCallback(() => {
    requestAnimationFrame(() => {
      hostRef.current?.measureInWindow((_x, y) => {
        setDropdownTopY(y);
      });
    });
  }, []);

  useEffect(() => {
    if (visible) measureTop();
  }, [visible, measureTop, windowHeight]);

  const maxHeight = useMemo(
    () =>
      Math.max(
        MIN_DROPDOWN_HEIGHT,
        windowHeight - dropdownTopY - keyboardHeight,
      ),
    [windowHeight, dropdownTopY, keyboardHeight],
  );

  if (!visible) return null;

  const hasRecent = recentQueries.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasFollowing = followingPicks.length > 0;

  if (!hasRecent && !hasSuggestions && !hasFollowing) {
    return null;
  }

  return (
    <View
      ref={hostRef}
      pointerEvents="box-none"
      className="absolute left-0 right-0 top-full z-50"
      onLayout={measureTop}
    >
      <View
        className="border-b border-gray-100 bg-page dark:border-dk-line dark:bg-dk-page"
        style={{ maxHeight }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          bounces={false}
          style={{ maxHeight }}
        >
          <View className="px-4 pb-4 pt-2">
            {hasRecent ? (
              <View className="mb-5">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="font-geist-semibold text-sm text-gray-500 dark:text-dk-muted">
                    {t("search.recent")}
                  </Text>
                  <Pressable
                    onPress={onClearRecent}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={t("search.clear")}
                    className="cursor-pointer py-1"
                  >
                    <Text className="font-geist-medium text-sm text-brand dark:text-dk-text">
                      {t("search.clear")}
                    </Text>
                  </Pressable>
                </View>
                {recentQueries.map((query) => (
                  <View
                    key={query}
                    className="flex-row items-center gap-3 py-2"
                  >
                    <Pressable
                      onPress={() => onSelect(query)}
                      className="min-w-0 flex-1 flex-row items-center gap-3"
                      accessibilityRole="button"
                      accessibilityLabel={query}
                    >
                      <Clock size={18} color={iconColor} />
                      <Text
                        numberOfLines={1}
                        className="min-w-0 flex-1 font-geist text-base text-ink dark:text-dk-text"
                      >
                        {query}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onRemoveRecent(query)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={t("search.removeRecent", { query })}
                      className="cursor-pointer p-1"
                    >
                      <X size={16} color={mutedIcon} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {hasSuggestions ? (
              <View className={hasFollowing ? "mb-5" : undefined}>
                <Text className="mb-1 font-geist-semibold text-sm text-gray-500 dark:text-dk-muted">
                  {t("search.suggestedForYou")}
                </Text>
                {suggestions.map((row) => (
                  <Pressable
                    key={`${row.source}:${row.label}`}
                    onPress={() => onSelect(row.label)}
                    accessibilityRole="button"
                    accessibilityLabel={row.label}
                    className="flex-row items-center gap-3 py-3"
                  >
                    <Search size={18} color={iconColor} />
                    <Text
                      numberOfLines={1}
                      className="min-w-0 flex-1 font-geist text-base text-ink dark:text-dk-text"
                    >
                      {row.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="max-w-[42%] text-right font-geist text-xs text-gray-400 dark:text-dk-faint"
                    >
                      {reasonForSource(t, row)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {hasFollowing ? (
              <View>
                <Text className="mb-2 font-geist-semibold text-base text-ink dark:text-dk-text">
                  {t("search.newFromPeopleYouFollow")}
                </Text>
                {followingPicks.map((pick, index) => {
                  const isLast = index === followingPicks.length - 1;
                  return (
                    <Pressable
                      key={pick.id}
                      onPress={() => onSelectFollowPick(pick)}
                      accessibilityRole="button"
                      accessibilityLabel={pick.title}
                      className="flex-row items-start gap-3 py-3"
                    >
                      <PickPreviewImage
                        imageUrl={pick.imageUrl}
                        index={index}
                        size="md"
                      />
                      <View
                        className={`min-w-0 flex-1 gap-0.5 pb-3 ${
                          isLast
                            ? ""
                            : "border-b border-gray-100 dark:border-dk-line"
                        }`}
                      >
                        <Text
                          numberOfLines={1}
                          className="font-geist-semibold text-base text-ink dark:text-dk-text"
                        >
                          {pick.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="font-geist text-sm text-gray-500 dark:text-dk-muted"
                        >
                          {[pick.category, pick.place].filter(Boolean).join(" · ")}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="font-geist text-sm text-gray-500 dark:text-dk-muted"
                        >
                          {pick.matchPercent !== undefined ? (
                            <Text className="font-geist-medium text-brand dark:text-dk-text">
                              {t("search.matchPercent", {
                                percent: pick.matchPercent,
                              })}
                            </Text>
                          ) : null}
                          {t("search.matchByAuthor", {
                            username: pick.username,
                          })}
                        </Text>
                        {/* {pick.reason ? (
                          <Text
                            numberOfLines={2}
                            className="mt-0.5 font-geist text-sm text-gray-500 dark:text-dk-muted"
                          >
                            {pick.reason}
                          </Text>
                        ) : null} */}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("search.cancel")}
        onPress={onDismiss}
        className="bg-transparent"
        style={{ minHeight: 800 }}
      />
    </View>
  );
}
