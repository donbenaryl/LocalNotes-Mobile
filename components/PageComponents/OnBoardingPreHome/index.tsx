import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { StepHomeBase } from "./StepHomeBase";
import { StepStarters } from "./StepStarters";
import { LocalNotesButton } from "../../ui/LocalNotesButton";
import { PageFooterWrapper } from "../../ui/PageFooterWrapper";
import { PageHeader } from "../../ui/PageHeader";
import accountServices from "@/http/account-api/account.services";
import type { Location } from "@/http/list-api/types";

type Step = 1 | 2;

interface OnBoardingPreHomeProps {
  onComplete: () => void;
}

export function OnBoardingPreHome({ onComplete }: OnBoardingPreHomeProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

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

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        borderless
        hideBack={currentStep === 1}
        onBack={currentStep === 2 ? () => setCurrentStep(1) : undefined}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2 items-center">
            {([1, 2] as Step[]).map((dot) => (
              <View
                key={dot}
                className={`rounded-full ${
                  dot <= currentStep
                    ? "w-2.5 h-2.5 bg-brand"
                    : "w-2 h-2 bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </View>
          <Pressable onPress={onComplete} className="cursor-pointer">
            <Text className="font-geist-semibold text-base text-gray-500 dark:text-gray-300">
              {t("preHomeOnboarding.skip")}
            </Text>
          </Pressable>
        </View>
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
