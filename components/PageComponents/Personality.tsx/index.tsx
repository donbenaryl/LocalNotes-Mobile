import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppScrollView } from "@/components/ui/AppScrollView";
import { PageLoader } from "@/components/ui/PageLoader";
import { LinearGradient } from "expo-linear-gradient";
import { Globe } from "lucide-react-native";
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
import { hasPersonality } from "@/utils/personality";
import { recordPersonalitySkip } from "@/utils/personalitySkips";
import { resolveUserLabels } from "@/utils/userDisplayName";
import {
  buildAnswersFromTraitScores,
  buildTouchedFromAnswers,
  slugifyTraitLabel,
} from "@/utils/personalityQuiz";
import { PersonalityChoice } from "./PersonalityChoice";

export type PersonalityPhase = "choice" | "quiz" | "submitting" | "result";

export interface PersonalityHandle {
  back: () => void;
}

interface PersonalityProps {
  onComplete: () => void | Promise<void>;
  hideBack?: boolean;
  fromOnboarding?: boolean;
  /** Parent owns PageHeader — never render chrome here. */
  hideChrome?: boolean;
  onPhaseChange?: (phase: PersonalityPhase) => void;
}

export const Personality = forwardRef<PersonalityHandle, PersonalityProps>(
  function Personality(
    {
      onComplete,
      hideBack = false,
      fromOnboarding = false,
      hideChrome = false,
      onPhaseChange,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const user = useAuthStore((state) => state.user);
    const [phase, setPhase] = useState<PersonalityPhase>("choice");
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [touched, setTouched] = useState<Record<number, boolean>>({});
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const cardRotation = useRef(new Animated.Value(0)).current;

    const allQuestions = useMemo(
      () => QUESTION_GROUPS.flatMap((group) => group.items),
      [],
    );
    const shouldHydrate = hasPersonality(
      user?.personalityName,
      user?.personalitySource,
    );

    const profileQuery = useQuery({
      queryKey: ["personality-profile"],
      queryFn: async () => {
        const response = await accountService.getPersonalityProfile();
        return response.data?.data ?? null;
      },
      enabled: shouldHydrate && phase !== "choice",
    });

    useEffect(() => {
      onPhaseChange?.(phase);
    }, [phase, onPhaseChange]);

    useImperativeHandle(ref, () => ({
      back: () => {
        if (phase === "result") {
          setPhase("quiz");
          return;
        }
        if (phase === "quiz") {
          setPhase("choice");
        }
      },
    }));

    useEffect(() => {
      // Quiz scores win; otherwise pre-fill from the inferred guess so the user can adjust it.
      const traitScores = profileQuery.data?.trait_scores?.length
        ? profileQuery.data.trait_scores
        : profileQuery.data?.inferred_trait_scores;
      if (!traitScores?.length) {
        return;
      }

      const nextAnswers = buildAnswersFromTraitScores(traitScores, allQuestions);
      setAnswers(nextAnswers);
      setTouched(buildTouchedFromAnswers(nextAnswers));
    }, [profileQuery.data, allQuestions]);

    const answeredCount = Object.keys(touched).length;
    const showInferredHint =
      !profileQuery.data?.trait_scores?.length &&
      !!profileQuery.data?.inferred_trait_scores?.length;

    const handleSkip = () => {
      // Count skips only while the profile is still empty (drives the launch gate).
      if (!hasPersonality(user?.personalityName, user?.personalitySource)) {
        void recordPersonalitySkip();
      }
      onComplete();
    };

    const handleComplete = async () => {
      if (isCompleting) return;
      setIsCompleting(true);
      try {
        await Promise.resolve(onComplete());
      } catch {
        setIsCompleting(false);
      }
    };

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
        const sliderValue = answers[item.id] ?? 50;
        return {
          left_trait: slugifyTraitLabel(item.leftLabel),
          left_trait_score: 100 - sliderValue,
          right_trait: slugifyTraitLabel(item.rightLabel),
          right_trait_score: sliderValue,
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

    const quizBody = (
      <>
        <AppScrollView
          className="flex-1 px-6 mt-4"
          contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {showInferredHint ? (
            <Text className="font-geist-medium text-sm text-gray-500 dark:text-dk-body mb-4">
              {t("personality.inferredPrefillHint")}
            </Text>
          ) : null}
          {QUESTION_GROUPS.map((group) => (
            <View key={group.sectionKey} className="mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-geist-semibold text-[11px] tracking-[0.2em] uppercase text-gray-400 dark:text-dk-faint">
                  {t(`personality.sections.${group.sectionKey}`)}
                </Text>
                <Text className="font-geist text-sm text-gray-400 dark:text-dk-faint">
                  {group.range}
                </Text>
              </View>

              <View className="rounded-2xl overflow-hidden border border-gray-200 dark:border-dk-border bg-card dark:bg-dk-page">
                {group.items.map((item) => {
                  const value = getValue(item.id);
                  const leftPercent = 100 - value;
                  const rightPercent = value;
                  return (
                    <View
                      key={item.id}
                      className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-dk-line last:border-b-0"
                    >
                      <Text className="font-geist text-[15px] text-ink dark:text-dk-text mb-2">
                        {item.question}
                      </Text>
                      {/* Opposition Questions */}
                      <View className="flex-row items-start justify-between gap-3 mb-1">
                        <Text className="min-w-0 flex-1 font-geist-medium text-[13px] text-gray-600 dark:text-dk-body">
                          {item.leftLabel}
                        </Text>
                        <Text className="min-w-0 flex-1 font-geist-medium text-[13px] text-gray-600 dark:text-dk-body text-right">
                          {item.rightLabel}
                        </Text>
                      </View>

                      <Slider
                        value={value}
                        colors={[item.leftColor, item.rightColor]}
                        onChange={(nextValue) => setAnswer(item.id, nextValue)}
                      />

                      <View className="flex-row items-center justify-between mt-1">
                        <Text className="font-geist text-[13px] text-gray-500 dark:text-dk-muted">
                          {leftPercent}%
                        </Text>
                        <Text className="font-geist text-[13px] text-gray-500 dark:text-dk-muted">
                          {rightPercent}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </AppScrollView>

        <PageFooterWrapper>
          <View className="flex-row items-center justify-between">
            <Text className="font-geist-medium text-base text-ink dark:text-dk-text">
              {answeredCount} /{" "}
              <Text className="font-geist-medium text-base text-gray-500 dark:text-dk-muted">
                {allQuestions.length} {t("personality.answered")}
              </Text>
            </Text>
            <LocalNotesButton
              label={t("personality.seeResult")}
              onPress={() => void submitQuiz()}
              variant="dark"
              className="px-5"
              isWidthFull={false}
            />
          </View>
        </PageFooterWrapper>
      </>
    );

    if (
      phase === "submitting" ||
      (shouldHydrate && profileQuery.isPending && phase !== "choice")
    ) {
      return (
        <PageLoader
          className="px-6"
          message={
            phase === "submitting" ? t("personality.analyzing") : undefined
          }
        />
      );
    }

    if (phase === "choice") {
      return (
        <PersonalityChoice
          questionCount={allQuestions.length}
          hideChrome={hideChrome || fromOnboarding}
          hideBack={hideBack}
          showStepper={false}
          onDiscover={() => setPhase("quiz")}
          onExplore={handleSkip}
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

      const resultBody = (
        <>
          <View className="flex-1 px-6 pb-28">
            <View className="flex-1 items-center justify-center">
              <View
                className="w-full max-w-[340px] h-[440px] relative"
                style={{ overflow: "hidden" }}
              >
                <View style={{ flex: 1, transform: [{ perspective: 1200 }] }}>
                  <Animated.View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      transform: [{ rotateY: frontRotate }],
                      backfaceVisibility: "hidden",
                    }}
                    className="rounded-2xl overflow-hidden"
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
                        {
                          resolveUserLabels({
                            username: user?.username,
                            firstName: user?.firstName,
                            lastName: user?.lastName,
                            name: user?.fullName,
                          }).primary
                        }
                      </Text>
                      <Text className="font-geist text-lg text-white/90 text-center mt-2">
                        {profile.tags}
                      </Text>
                      <Text className="font-geist italic text-base text-white/70 text-center mt-8">
                        {t("personality.tapToFlip")}
                      </Text>
                    </Pressable>
                  </Animated.View>

                  <Animated.View
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      transform: [{ rotateY: backRotate }],
                      backfaceVisibility: "hidden",
                    }}
                    className="rounded-2xl overflow-hidden"
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
                isWidthFull={false}
                className="flex-1"
              />
              <LocalNotesButton
                label={t("personality.complete")}
                onPress={() => void handleComplete()}
                variant="light"
                isWidthFull={false}
                className="flex-1"
                disabled={isCompleting}
                loading={isCompleting}
              />
            </View>
          </PageFooterWrapper>
        </>
      );

      if (hideChrome) {
        return <View className="flex-1">{resultBody}</View>;
      }

      return (
        <View className="flex-1">
          <PageHeader
            title={t("personality.yourPersonality")}
            onBack={() => setPhase("quiz")}
            hideBack={false}
          />
          {resultBody}
        </View>
      );
    }

    // Quiz
    if (hideChrome) {
      return <View className="flex-1">{quizBody}</View>;
    }

    return (
      <View className="flex-1">
        <PageHeader hideBack={false} onBack={() => setPhase("choice")}>
          <Text className="font-geist-semibold text-[12px] tracking-[0.16em] uppercase text-brand dark:text-dk-text">
            {t("personality.header")} . {allQuestions.length}Q
          </Text>
        </PageHeader>
        {quizBody}
      </View>
    );
  },
);
