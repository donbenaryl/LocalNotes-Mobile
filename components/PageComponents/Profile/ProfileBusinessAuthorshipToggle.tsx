import { useTranslation } from "react-i18next";
import { Toggle } from "@/components/ui/Toggle";
import type { BusinessAuthorship } from "@/hooks/useProfileList";

interface ProfileBusinessAuthorshipToggleProps {
  businessName: string;
  value: BusinessAuthorship;
  onChange: (value: BusinessAuthorship) => void;
}

export function ProfileBusinessAuthorshipToggle({
  businessName,
  value,
  onChange,
}: ProfileBusinessAuthorshipToggleProps) {
  const { t } = useTranslation();

  return (
    <Toggle
      value={value}
      onChange={onChange}
      className="self-start mb-3"
      options={[
        {
          value: "about",
          label: t("profile.businessAuthorship.about", { name: businessName }),
        },
        {
          value: "by",
          label: t("profile.businessAuthorship.by", { name: businessName }),
        },
      ]}
    />
  );
}
