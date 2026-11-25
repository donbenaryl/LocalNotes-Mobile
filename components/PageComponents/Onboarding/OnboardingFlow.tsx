import { useCallback, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Personality,
  type PersonalityHandle,
  type PersonalityPhase,
} from "../Personality.tsx";
import { StepHomeBase } from "../OnBoardingPreHome/StepHomeBase";
import { StepStarters } from "../OnBoardingPreHome/StepStarters";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { PageFooterWrapper } from "@/components/ui/PageFooterWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { OnboardingStepper } from "@/components/ui/OnboardingStepper";
import accountServices from "@/http/account-api/account.services";
import type { Location } from "@/http/list-api/types";
import { hydrateUserProfile } from "@/services/authBootstrap";

type GlobalStep = 1 | 2 | 3;

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t } = useTranslation();
  const [globalStep, setGlobalStep] = useState<GlobalStep>(1);
  const [personalityPhase, setPersonalityPhase] =
    useState<PersonalityPhase>("choice");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const personalityRef = useRef<PersonalityHandle>(null);

  const saveLocationMutation = useMutation({
    mutationFn: async (location: Location) => {
      const { data, error } = await accountServices.updateAccount({ location });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const handlePersonalityComplete = useCallback(async () => {
    await hydrateUserProfile();
    setGlobalStep(2);
  }, []);

  const handleHeaderBack = () => {
    if (globalStep === 1) {
      personalityRef.current?.back();
      return;
    }
    if (globalStep === 3) {
      setGlobalStep(2);
      return;
    }
    setGlobalStep(1);
  };

  const handleSkip = () => {
    if (globalStep === 2) {
      setGlobalStep(3);
      return;
    }
    if (globalStep === 3) {
      onComplete();
    }
  };

  const handleContinueHomeBase = async () => {
    if (!selectedLocation) return;
    try {
      await saveLocationMutation.mutateAsync(selectedLocation);
      setGlobalStep(3);
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  };

  const hideBack =
    globalStep === 1 &&
    (personalityPhase === "choice" || personalityPhase === "submitting");

  const showSkip = globalStep === 2 || globalStep === 3;

  return (
    <View className="flex-1 bg-page dark:bg-dk-page">
      <PageHeader
        borderless
        hideBack={hideBack}
        onBack={handleHeaderBack}
        centerChildren
        rightChild={
          showSkip ? (
            <Pressable onPress={handleSkip} className="cursor-pointer">
              <Text className="font-geist-semibold text-base text-gray-500 dark:text-dk-body">
                {t("preHomeOnboarding.skip")}
              </Text>
            </Pressable>
          ) : null
        }
      >
        <OnboardingStepper current={globalStep} />
      </PageHeader>

      <Animated.View
        key={globalStep}
        entering={FadeIn.duration(220)}
        className="flex-1"
      >
        {globalStep === 1 ? (
          <Personality
            ref={personalityRef}
            hideChrome
            hideBack
            fromOnboarding
            onPhaseChange={setPersonalityPhase}
            onComplete={() => void handlePersonalityComplete()}
          />
        ) : null}

        {globalStep === 2 ? (
          <>
            <StepHomeBase onLocationSelect={setSelectedLocation} />
            <PageFooterWrapper>
              <LocalNotesButton
                label={t("common.continue")}
                onPress={() => void handleContinueHomeBase()}
                variant="dark"
                isRounded
                disabled={
                  !selectedLocation || saveLocationMutation.isPending
                }
                rightIcon={<ChevronRight size={18} color="white" />}
              />
            </PageFooterWrapper>
          </>
        ) : null}

        {globalStep === 3 ? <StepStarters /> : null}
      </Animated.View>
    </View>
  );
}
