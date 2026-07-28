import { Animated, Text, View, useWindowDimensions } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { CardHero } from "@/components/ui/CardHero";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { Modal } from "@/components/ui/Modal";
import { MorphFromOriginView } from "@/components/ui/MorphFromOriginView";
import { NoImage } from "@/components/ui/NoImage";
import { resolveImageUrl } from "@/utils/httpHelpers";
import { formatListLocation } from "@/utils/listUi";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { ListDetailsComments } from "./ListDetailsComments";
import type { Item, ListItemDAO } from "@/http/list-api/types";
import type { ScreenRect } from "@/types/layout";

const COMMENTS_SHEET_HEIGHT_RATIO = 0.6;
const PREVIEW_MAX_HEIGHT_RATIO = 0.38;

interface ListCommentsSheetProps {
  visible: boolean;
  onClose: () => void;
  list: ListItemDAO;
  onCommentCountChange?: (count: number) => void;
  /** Screen rect of the card that opened this sheet — the preview morphs out of it. */
  originRect?: ScreenRect | null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function getHeroImageUrl(list: ListItemDAO): string | null {
  const cover = resolveImageUrl(list.image_url);
  if (cover) return cover;

  for (const item of list.items ?? []) {
    const itemImage =
      resolveImageUrl(item.images?.[0]?.url) ??
      resolveImageUrl(item.business?.logo);
    if (itemImage) return itemImage;
  }

  return null;
}

function getPickName(item: Item): string | null {
  return item.business?.name ?? item.unverified_business?.name ?? null;
}

export function ListCommentsSheet({
  visible,
  onClose,
  list,
  onCommentCountChange,
  originRect,
}: ListCommentsSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const heroImageUrl = getHeroImageUrl(list);
  const gradientColors = getPersonalityGradientColors(
    list.account.personality_color,
  );
  const accentColor = gradientColors[0] ?? "#FF6B1A";
  const picksCount = list.items?.length ?? 0;
  const locationLabel = formatListLocation(list.location);
  const topPicksLabel = (list.items ?? [])
    .slice(0, 2)
    .map((item) => getPickName(item))
    .filter(Boolean)
    .join(" · ");
  const notePreview = list.notes ? stripHtml(list.notes) : null;

  const renderPreviewContent = (progress: Animated.Value) => (
    <SafeAreaView edges={["top"]} className="flex-1 px-3 pb-3 pt-3">
      <MorphFromOriginView
        progress={progress}
        originRect={originRect}
        containerClassName="flex-1"
        containerStyle={{ maxHeight: height * PREVIEW_MAX_HEIGHT_RATIO }}
        className="h-full overflow-hidden rounded-[24px] border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      >
        {heroImageUrl ? (
          <CardHero
            imageUrl={heroImageUrl}
            title={list.name}
            subtitle={topPicksLabel || undefined}
            aspectClassName="flex-1"
          />
        ) : (
          <View className="flex-1 flex-row items-center gap-3 px-4 pb-3 pt-4">
            <NoImage
              personalityColor={list.account.personality_color}
              size="md"
              appearance="flat"
              outerClassName="h-14 w-14 rounded-2xl"
              innerClassName="rounded-[13px] border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
            />
            <View className="min-w-0 flex-1">
              <Text
                className="font-geist-extrabold text-[20px] leading-6 text-ink dark:text-gray-100"
                numberOfLines={2}
              >
                {list.name}
              </Text>
              {topPicksLabel ? (
                <Text
                  className="mt-1 font-geist-medium text-[13px] text-gray-500 dark:text-gray-400"
                  numberOfLines={2}
                >
                  {topPicksLabel}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <Animated.View
          className="gap-2.5 px-4 py-3"
          style={{
            opacity: progress.interpolate({
              inputRange: [0, 0.55, 1],
              outputRange: [0, 0, 1],
            }),
          }}
        >
          <View className="flex-row items-center gap-2.5">
            <Avatar
              name={list.account.name}
              src={resolveImageUrl(list.account.profile_image) ?? undefined}
              size="sm"
              userId={list.account.id}
              gradientColors={gradientColors}
            />
            <View className="min-w-0 flex-1">
              <Text
                className="font-geist-semibold text-[14px] text-ink dark:text-gray-100"
                numberOfLines={1}
              >
                {list.account.name}
              </Text>
              {list.personality_name || list.account.personality_name ? (
                <Text
                  className="font-fraunces text-[12px] italic"
                  style={{ color: accentColor }}
                  numberOfLines={1}
                >
                  {list.personality_name ?? list.account.personality_name}
                </Text>
              ) : (
                <Text
                  className="font-geist text-[12px] text-gray-500 dark:text-gray-400"
                  numberOfLines={1}
                >
                  {t("home.picksCount", { count: picksCount })}
                </Text>
              )}
            </View>
          </View>

          {notePreview ? (
            <Text
              className="font-geist text-[13px] leading-5 text-gray-600 dark:text-gray-300"
              numberOfLines={3}
            >
              {notePreview}
            </Text>
          ) : null}

          {locationLabel ? (
            <View className="flex-row items-center gap-1.5">
              <MapPin size={12} color="#9CA3AF" />
              <Text
                className="flex-1 font-geist text-[12px] text-gray-500 dark:text-gray-400"
                numberOfLines={1}
              >
                {locationLabel}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      </MorphFromOriginView>
    </SafeAreaView>
  );

  return (
    // Comment Modal
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      avoidKeyboard={false}
      sheetHeightRatio={COMMENTS_SHEET_HEIGHT_RATIO}
      backdropColor="#000000"
      backdropOpacityValue={1}
      topContent={renderPreviewContent}
    >
      <KeyboardAwareScrollView
        className="-mx-8 flex-1"
        contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }}
        scrollToFocusedInput
      >
        <ListDetailsComments
          list={list}
          containerClassName="px-[18px] pb-[18px] pt-1"
          onCommentCountChange={onCommentCountChange}
        />
      </KeyboardAwareScrollView>
    </Modal>
  );
}
