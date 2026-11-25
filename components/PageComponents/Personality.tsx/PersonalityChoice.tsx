import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { AppScrollView } from "@/components/ui/AppScrollView";
import { OnboardingStepper } from "@/components/ui/OnboardingStepper";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTitleHeading } from "@/components/ui/PageTitleHeading";
import { Slider } from "@/components/ui/Slider";
import { WhiteBox } from "@/components/ui/WhiteBox";
import { Badge } from "@/components/ui/Badge";

const ARCHETYPES = [
  { key: "explorer", color: "#0F6E56" },
  { key: "connector", color: "#534AB7" },
  { key: "curator", color: "#BA7517" },
  { key: "creator", color: "#D4537E" },
] as const;

const BANNER_WELL = "#F3EDE6";

interface PersonalityChoiceProps {
  questionCount: number;
  showStepper?: boolean;
  hideBack?: boolean;
  /** When true, parent owns PageHeader — render body only. */
  hideChrome?: boolean;
  onDiscover: () => void;
  onExplore: () => void;
  onBack?: () => void;
}

function SliderIllustration() {
  const [top, setTop] = useState(72);
  const [mid, setMid] = useState(28);
  const [bot, setBot] = useState(58);

  return (
    <View
      pointerEvents="none"
      className="rounded-xl px-4 py-3 mb-4"
      style={{ backgroundColor: BANNER_WELL }}
    >
      <Slider value={top} onChange={setTop} colors={["#EF4444", "#3B82F6"]} />
      <Slider value={mid} onChange={setMid} colors={["#F59E0B", "#E76E04"]} />
      <Slider value={bot} onChange={setBot} colors={["#3B82F6", "#EF4444"]} />
    </View>
  );
}

const EXPLORE_CARD_W = 100;
const EXPLORE_CARD_H = 58;
/** Horizontal shift so center covers ~20–25% of each side card */
const EXPLORE_SIDE_OFFSET = EXPLORE_CARD_W * 0.5;

function ExploreCard({
  colors,
  rotate,
  translateX = 0,
  translateY = 0,
  zIndex,
  elevation,
  shadowOpacity,
  shadowRadius,
}: {
  colors: [string, string];
  rotate?: string;
  translateX?: number;
  translateY?: number;
  zIndex: number;
  elevation: number;
  shadowOpacity: number;
  shadowRadius: number;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: EXPLORE_CARD_W,
        height: EXPLORE_CARD_H,
        marginLeft: -EXPLORE_CARD_W / 2,
        marginTop: -EXPLORE_CARD_H / 2,
        transform: [
          { translateX },
          { translateY },
          ...(rotate ? [{ rotate }] : []),
        ],
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity,
        shadowRadius,
        elevation,
        zIndex,
      }}
    >
      <View className="flex-1 rounded-2xl overflow-hidden">
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function ExploreIllustration() {
  return (
    <View
      className="rounded-xl mb-4 items-center justify-center pb-3"
      style={{ backgroundColor: BANNER_WELL, height: 100 }}
    >
      <ExploreCard
        colors={["#2E1A7A", "#7D26CD"]}
        rotate="-12deg"
        translateX={-EXPLORE_SIDE_OFFSET}
        translateY={5}
        zIndex={1}
        elevation={3}
        shadowOpacity={0.16}
        shadowRadius={6}
      />
      <ExploreCard
        colors={["#B24410", "#F9A602"]}
        rotate="12deg"
        translateX={EXPLORE_SIDE_OFFSET}
        translateY={5}
        zIndex={1}
        elevation={3}
        shadowOpacity={0.16}
        shadowRadius={6}
      />
      <ExploreCard
        colors={["#5F9EA0", "#E0E0D1"]}
        zIndex={2}
        elevation={6}
        shadowOpacity={0.2}
        shadowRadius={8}
      />
    </View>
  );
}

export function PersonalityChoice({
  questionCount,
  showStepper = false,
  hideBack = false,
  hideChrome = false,
  onDiscover,
  onExplore,
  onBack,
}: PersonalityChoiceProps) {
  const { t } = useTranslation();

  const body = (
    <AppScrollView
      className="flex-1 px-6"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <PageTitleHeading
        alignLeft
        hideLogo
        containerClassName="mb-4"
        title={t("personality.choiceTitlePrefix").trimEnd()}
        subtitle={`${t("personality.choiceTitleVibe")}${t("personality.choiceTitleSuffix")}`}
        description={t("personality.choiceSubtitle")}
      />

      <Pressable onPress={onDiscover} className="mb-3 active:opacity-90">
        <WhiteBox>
          <SliderIllustration />
          <View className="flex-row items-center justify-between gap-2 mb-2">
            <Text className="font-geist-bold text-lg text-ink dark:text-dk-text flex-1">
              {t("personality.discoverTitle")}
            </Text>
            <Badge label={t("personality.recommended")} variant="primary" />
          </View>
          <Text className="font-geist text-[14px] leading-5 text-gray-500 dark:text-dk-body mb-4">
            {t("personality.discoverBody", { count: questionCount })}
          </Text>
          <View className="flex-row flex-wrap gap-x-4 gap-y-2">
            {ARCHETYPES.map((item) => (
              <View key={item.key} className="flex-row items-center gap-1.5">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <Text className="font-geist-medium text-[12px] text-gray-600 dark:text-dk-muted">
                  {t(`personality.archetypes.${item.key}`)}
                </Text>
              </View>
            ))}
          </View>
        </WhiteBox>
      </Pressable>

      <Pressable onPress={onExplore} className="active:opacity-90">
        <WhiteBox>
          <ExploreIllustration />
          <Text className="font-geist-bold text-lg text-ink dark:text-dk-text mb-2">
            {t("personality.exploreTitle")}
          </Text>
          <Text className="font-geist text-[14px] leading-5 text-gray-500 dark:text-dk-body">
            {t("personality.exploreBody")}
          </Text>
        </WhiteBox>
      </Pressable>
    </AppScrollView>
  );

  if (hideChrome) {
    return <View className="flex-1">{body}</View>;
  }

  return (
    <View className="flex-1">
      <PageHeader
        borderless
        hideBack={hideBack}
        onBack={onBack}
        centerChildren={showStepper}
      >
        {showStepper ? <OnboardingStepper current={1} /> : null}
      </PageHeader>
      {body}
    </View>
  );
}
