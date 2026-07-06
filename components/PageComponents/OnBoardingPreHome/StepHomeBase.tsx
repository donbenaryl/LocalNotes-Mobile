import { ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { LocationInput } from "@/components/ui/LocationInput";
import { PageTitleHeading } from "@/components/ui/PageTitleHeading";
import type { Location } from "@/http/list-api/types";

interface StepHomeBaseProps {
  onLocationSelect: (location: Location) => void;
}

export function StepHomeBase({ onLocationSelect }: StepHomeBaseProps) {
  const { t } = useTranslation();

  return (
    <ScrollView
      className="flex-1 px-6"
      contentContainerStyle={{ paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      <PageTitleHeading
        stepTitle={t("preHomeOnboarding.step1.kicker")}
        containerClassName="mb-4"
        alignLeft
        hideLogo
        title={t("preHomeOnboarding.step1.titleRegular")}
        subtitle={t("preHomeOnboarding.step1.titleItalic")}
        description={t("preHomeOnboarding.step1.description")}
      />

      <LocationInput
        onLocationSelected={onLocationSelect}
        placeholder={t("preHomeOnboarding.step1.searchPlaceholder")}
      />
    </ScrollView>
  );
}
