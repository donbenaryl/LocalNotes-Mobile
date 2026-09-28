import { View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Link2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
} from "lucide-react-native";
import { UploadAvatar } from "@/components/ui/UploadAvatar";
import { SettingsNavRow } from "@/components/PageComponents/Profile/AccountSettings/SettingsNavRow";
import { SettingsSection } from "@/components/PageComponents/Profile/AccountSettings/SettingsSection";

export interface EditProfileHubBusinessSummary {
  name: string;
  type: string;
  branchCount: number;
}

interface EditProfileHubProps {
  avatarName: string;
  avatarSrc?: string;
  gradientColors: string[];
  displayName: string;
  username: string;
  socialSummary: string;
  homeCity?: string;
  personalityName?: string;
  email: string;
  business?: EditProfileHubBusinessSummary;
  onOpenBusiness: () => void;
  onOpenPersonal: () => void;
  onOpenSocial: () => void;
  onOpenHomeCity: () => void;
  onOpenPersonality: () => void;
  onPressPhone: () => void;
}

export function EditProfileHub({
  avatarName,
  avatarSrc,
  gradientColors,
  displayName,
  username,
  socialSummary,
  homeCity,
  personalityName,
  email,
  business,
  onOpenBusiness,
  onOpenPersonal,
  onOpenSocial,
  onOpenHomeCity,
  onOpenPersonality,
  onPressPhone,
}: EditProfileHubProps) {
  const { t } = useTranslation();

  const aboutYouSubtitle =
    [displayName.trim(), username.trim() ? `@${username.trim()}` : ""]
      .filter(Boolean)
      .join(" · ") || t("editProfile.hub.aboutYouEmpty");

  const businessSubtitle = business
    ? [
        business.type,
        business.branchCount === 1
          ? t("editProfile.hub.branchCountOne")
          : t("editProfile.hub.branchCountOther", {
              count: business.branchCount,
            }),
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <>
      <View className="items-center pt-2 pb-6">
        <UploadAvatar
          name={avatarName}
          src={avatarSrc}
          gradientColors={gradientColors}
        />
      </View>

      {business ? (
        <SettingsSection title={t("editProfile.sections.business")}>
          <SettingsNavRow
            icon={Building2}
            title={business.name || t("editProfile.hub.businessUntitled")}
            subtitle={businessSubtitle}
            onPress={onOpenBusiness}
            isLast
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title={t("editProfile.sections.profile")}>
        <SettingsNavRow
          icon={User}
          title={t("editProfile.hub.aboutYou")}
          subtitle={aboutYouSubtitle}
          onPress={onOpenPersonal}
        />
        <SettingsNavRow
          icon={Link2}
          title={t("editProfile.hub.social")}
          value={socialSummary || t("editProfile.add")}
          onPress={onOpenSocial}
          isLast
        />
      </SettingsSection>

      <SettingsSection title={t("editProfile.sections.locationTaste")}>
        <SettingsNavRow
          icon={MapPin}
          title={t("editProfile.hub.homeCity")}
          subtitle={t("editProfile.hub.homeCitySub")}
          value={homeCity || t("editProfile.add")}
          onPress={onOpenHomeCity}
        />
        <SettingsNavRow
          icon={Sparkles}
          title={t("editProfile.hub.personality")}
          subtitle={t("editProfile.hub.personalitySub")}
          value={personalityName}
          onPress={onOpenPersonality}
          isLast
        />
      </SettingsSection>

      <SettingsSection title={t("editProfile.sections.account")}>
        <SettingsNavRow
          icon={Mail}
          title={t("editProfile.hub.email")}
          subtitle={email}
          showChevron={false}
        />
        <SettingsNavRow
          icon={Phone}
          title={t("editProfile.hub.phone")}
          subtitle={t("editProfile.hub.phoneSub")}
          value={t("editProfile.add")}
          onPress={onPressPhone}
          isLast
        />
      </SettingsSection>
    </>
  );
}
