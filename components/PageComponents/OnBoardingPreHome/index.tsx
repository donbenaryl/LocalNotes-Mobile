import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import type { Href } from "expo-router";
import { StepHomeBase } from "./StepHomeBase";
import { StepStarters } from "./StepStarters";
import { LocalNotesButton } from "../../ui/LocalNotesButton";
import { PageFooterWrapper } from "../../ui/PageFooterWrapper";
import { PageHeader } from "../../ui/PageHeader";
import { OnboardingStepper } from "../../ui/OnboardingStepper";
import accountServices from "@/http/account-api/account.services";
import type { Location } from "@/http/list-api/types";

type Step = 1 | 2;

interface OnBoardingPreHomeProps {
  onComplete: () => void;
}

export function OnBoardingPreHome({ onComplete }: OnBoardingPreHomeProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const globalStep = (currentStep === 1 ? 2 : 3) as 2 | 3;

  const saveLocationMutation = useMutation({
    mutationFn: async (location: Location) => {
      const { data, error } = await accountServices.updateAccount({ location });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const handleContinue = async () => {
    if (currentStep === 1) {
      if (!selectedLocation) return;
      try {
        await saveLocationMutation.mutateAsync(selectedLocation);
        setCurrentStep(2);
      } catch (error) {
        console.error("Failed to save location:", error);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }
    router.replace({
      pathname: "/personality",
      params: { fromOnboarding: "true" },
    } as Href);
  };

  const handleSkip = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
    onComplete();
  };

  return (
    <View className="flex-1 bg-page dark:bg-dk-page">
      <PageHeader
        borderless
        onBack={handleBack}
        centerChildren
        rightChild={
          <Pressable onPress={handleSkip} className="cursor-pointer">
            <Text className="font-geist-semibold text-base text-gray-500 dark:text-dk-body">
              {t("preHomeOnboarding.skip")}
            </Text>
          </Pressable>
        }
      >
        <OnboardingStepper current={globalStep} />
      </PageHeader>

      {/* Step content */}
      {currentStep === 1 && (
        <StepHomeBase onLocationSelect={setSelectedLocation} />
      )}
      {currentStep === 2 && <StepStarters />}

      {/* Footer Continue button — step 1 only */}
      {currentStep !== 2 && (
        <PageFooterWrapper>
          <LocalNotesButton
            label={t("common.continue")}
            onPress={handleContinue}
            variant="dark"
            isRounded
            disabled={
              (currentStep === 1 && !selectedLocation) ||
              saveLocationMutation.isPending
            }
            rightIcon={<ChevronRight size={18} color="white" />}
          />
        </PageFooterWrapper>
      )}
    </View>
  );
}
