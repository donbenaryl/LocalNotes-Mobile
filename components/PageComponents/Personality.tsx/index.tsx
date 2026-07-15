import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PageLoader } from "@/components/ui/PageLoader";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Globe } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import accountService from "../../../http/account-api/account.services";
import type { UserProfileData } from "../../../http/account-api/types";
import { useAuthStore } from "../../../stores/useAuthStore";
import { PageHeader } from "../../ui/PageHeader";
import { PageFooterWrapper } from "../../ui/PageFooterWrapper";
import { Slider } from "../../ui/Slider";
import {
  MIN_SUBMITTING_DISPLAY_MS,
  QUESTION_GROUPS,
} from "@/constants/personality";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { hasCompletedPersonalityQuiz } from "@/utils/personality";
import {
  buildAnswersFromTraitScores,
  buildTouchedFromAnswers,
  slugifyTraitLabel,
} from "@/utils/personalityQuiz";

interface PersonalityProps {
  onComplete: () => void;
  hideBack?: boolean;
}

export function Personality({ onComplete, hideBack = false }: PersonalityProps) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [phase, setPhase] = useState<"quiz" | "submitting" | "result">("quiz");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRotation = useRef(new Animated.Value(0)).current;

  const allQuestions = useMemo(
    () => QUESTION_GROUPS.flatMap((group) => group.items),
    [],
  );
  const shouldHydrate = hasCompletedPersonalityQuiz(user?.personalityName);

  const profileQuery = useQuery({
    queryKey: ["personality-profile"],
    queryFn: async () => {
      const response = await accountService.getPersonalityProfile();
      return response.data?.data ?? null;
    },
    enabled: shouldHydrate,
  });

  useEffect(() => {
    const traitScores = profileQuery.data?.trait_scores;
    if (!traitScores?.length) {
      return;
    }

    const nextAnswers = buildAnswersFromTraitScores(traitScores, allQuestions);
    setAnswers(nextAnswers);
    setTouched(buildTouchedFromAnswers(nextAnswers));
  }, [profileQuery.data, allQuestions]);

  const answeredCount = Object.keys(touched).length;

  const setAnswer = (questionId: number, nextValue: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: nextValue }));
    setTouched((prev) => ({ ...prev, [questionId]: true }));
  };

  const getValue = (questionId: number) => answers[questionId] ?? 50;

  const resetQuiz = () => {
    setAnswers({});
    setTouched({});
    setProfile(null);
    setPhase("quiz");
    setIsFlipped(false);
    cardRotation.setValue(0);
  };

  const flipCard = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    Animated.spring(cardRotation, {
      toValue: nextFlipped ? 1 : 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  };

  const submitQuiz = async () => {
    const startedAt = Date.now();
    setPhase("submitting");
    const payload = allQuestions.map((item) => {
      const leftScore = answers[item.id] ?? 50;
      return {
        left_trait: slugifyTraitLabel(item.leftLabel),
        left_trait_score: leftScore,
        right_trait: slugifyTraitLabel(item.rightLabel),
        right_trait_score: 100 - leftScore,
      };
    });

    try {
      const response = await accountService.creatPersonalityProfile(payload);
      if (response.data?.data) {
        setProfile(response.data.data);
      } else {
        setPhase("quiz");
        return;
      }
    } catch {
      setPhase("quiz");
      return;
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MIN_SUBMITTING_DISPLAY_MS - elapsed);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    setPhase("result");
  };

  if (phase === "submitting" || (shouldHydrate && profileQuery.isPending)) {
    return (
      <PageLoader
        className="px-6"
        message={phase === "submitting" ? t("personality.analyzing") : undefined}
      />
    );
  }

  if (phase === "result" && profile) {
    const sortedColors = Object.entries(profile.color_breakdown ?? {}).sort(
      (a, b) => b[1] - a[1],
    );
    const topColors = sortedColors.slice(0, 3).map(([color]) => color);
    const gradientColors: [string, string, string] = [
      topColors[0] ?? "#0F6E56",
      topColors[1] ?? topColors[0] ?? "#534AB7",
      topColors[2] ?? topColors[1] ?? topColors[0] ?? "#D4537E",
    ];

    const frontRotate = cardRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });
    const backRotate = cardRotation.interpolate({
      inputRange: [0, 1],
      outputRange: ["180deg", "360deg"],
    });

    return (
      <View className="flex-1">
        <PageHeader
          title={t("personality.yourPersonality")}
          onBack={hideBack ? undefined : () => setPhase("quiz")}
          hideBack={hideBack}
        />

        <View className="flex-1 px-6 pb-28">
          <View className="flex-1 items-center justify-center">
            <View
              className="w-full max-w-[340px] h-[440px] relative"
              style={{ overflow: "hidden" }}
            >
              <View style={{ flex: 1, transform: [{ perspective: 1200 }] }}>
                {/* Personality Card — front face */}
                <Animated.View
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    transform: [{ rotateY: frontRotate }],
                    backfaceVisibility: "hidden",
                  }}
                  className="rounded-[28px] overflow-hidden"
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Pressable
                    onPress={flipCard}
                    className="flex-1 px-8 py-12 items-center justify-center cursor-pointer"
                  >
                    <View className="w-20 h-20 rounded-full bg-white/25 items-center justify-center mb-8">
                      <Globe size={34} color="#1F2937" strokeWidth={1.75} />
                    </View>
                    <Text className="font-geist-bold text-3xl text-white text-center">
                      {user?.fullName ?? "User"}
                    </Text>
                    <Text className="font-geist text-lg text-white/90 text-center mt-2">
                      {profile.tags}
                    </Text>
                    <Text className="font-geist italic text-base text-white/70 text-center mt-8">
                      {t("personality.tapToFlip")}
                    </Text>
                  </Pressable>
                </Animated.View>

                {/* Personality Card — back face */}
                <Animated.View
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    transform: [{ rotateY: backRotate }],
                    backfaceVisibility: "hidden",
                  }}
                  className="rounded-[28px] overflow-hidden"
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Pressable
                    onPress={flipCard}
                    className="flex-1 px-8 py-12 items-center justify-center cursor-pointer"
                  >
                    <Text className="font-geist-bold text-2xl text-white text-center mb-4">
                      {profile.tags}
                    </Text>
                    <Text className="font-geist text-base text-white/85 text-center leading-6">
                      {profile.description}
                    </Text>
                    <Text className="font-geist italic text-base text-white/70 text-center mt-8">
                      {t("personality.tapToFlip")}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </View>
        </View>

        <PageFooterWrapper>
          <View className="flex-row gap-3">
            <LocalNotesButton
              label={t("personality.retake")}
              onPress={resetQuiz}
              variant="dark"
              isRounded
              isWidthFull={false}
              className="flex-1"
            />
            <LocalNotesButton
              label={t("personality.complete")}
              onPress={onComplete}
              variant="light"
              isRounded
              isWidthFull={false}
              className="flex-1"
            />
          </View>
        </PageFooterWrapper>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <PageHeader hideBack={hideBack}>
        <View className="flex-row items-center justify-between">
          <Text className="font-geist-semibold text-[12px] tracking-[0.16em] uppercase text-brand">
            {t("personality.header")} . {allQuestions.length}Q
          </Text>
          <Pressable
            onPress={onComplete}
            className="flex-row items-center gap-1 cursor-pointer"
          >
            <Text className="font-geist-semibold text-base text-gray-500 dark:text-gray-300">
              {t("personality.skip")}
            </Text>
            <ChevronRight size={18} color="#6B7280" />
          </Pressable>
        </View>
      </PageHeader>

      <ScrollView
        className="flex-1 px-6 mt-4"
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {QUESTION_GROUPS.map((group) => (
          <View key={group.sectionKey} className="mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-geist-semibold text-[11px] tracking-[0.2em] uppercase text-gray-400 dark:text-gray-500">
                {t(`personality.sections.${group.sectionKey}`)}
              </Text>
              <Text className="font-geist text-sm text-gray-400 dark:text-gray-500">
                {group.range}
              </Text>
            </View>

            <View className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              {group.items.map((item) => {
                const value = getValue(item.id);
                const leftPercent = 100 - value;
                const rightPercent = value;
                return (
                  <View
                    key={item.id}
                    className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                  >
                    <Text className="font-geist text-[15px] text-ink dark:text-gray-100 mb-2">
                      {item.question}
                    </Text>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-geist-medium text-[13px] text-gray-600 dark:text-gray-300">
                        {item.leftLabel}
                      </Text>
                      <Text className="font-geist-medium text-[13px] text-gray-600 dark:text-gray-300 text-right">
                        {item.rightLabel}
                      </Text>
                    </View>

                    <Slider
                      value={value}
                      colors={[item.leftColor, item.rightColor]}
                      onChange={(nextValue) => setAnswer(item.id, nextValue)}
                    />

                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="font-geist text-[13px] text-gray-500 dark:text-gray-400">
                        {leftPercent}%
                      </Text>
                      <Text className="font-geist text-[13px] text-gray-500 dark:text-gray-400">
                        {rightPercent}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <PageFooterWrapper>
        <View className="flex-row items-center justify-between">
          <Text className="font-geist-medium text-base text-ink dark:text-gray-100">
            {answeredCount} /{" "}
            <Text className="font-geist-medium text-base text-gray-500 dark:text-gray-400">
              {allQuestions.length} {t("personality.answered")}
            </Text>
          </Text>
          <LocalNotesButton
            label={t("personality.seeResult")}
            onPress={() => void submitQuiz()}
            variant="dark"
            className="px-5"
            size="sm"
            isWidthFull={false}
            isRounded
          />
        </View>
      </PageFooterWrapper>
    </View>
  );
}
