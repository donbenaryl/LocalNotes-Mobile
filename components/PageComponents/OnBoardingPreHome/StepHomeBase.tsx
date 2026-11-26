import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppScrollView } from "@/components/ui/AppScrollView";
import { LocationInput } from "@/components/ui/LocationInput";
import { PageTitleHeading } from "@/components/ui/PageTitleHeading";
import type { Location } from "@/http/list-api/types";

interface StepHomeBaseProps {
  onLocationSelect: (location: Location) => void;
}

export function StepHomeBase({ onLocationSelect }: StepHomeBaseProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <AppScrollView
      className="flex-1 px-6"
      contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
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
    </AppScrollView>
  );
}
