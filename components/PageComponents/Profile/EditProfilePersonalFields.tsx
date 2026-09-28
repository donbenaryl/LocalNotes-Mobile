import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { DateField } from "@/components/ui/DateField";
import { TextInput } from "@/components/ui/TextInput";
import { UsernameField } from "@/components/ui/UsernameField";
import type { UsernameAvailabilityStatus } from "@/hooks/useUsernameAvailability";

const PLACEHOLDER_COLOR = "#6B7280";

export interface EditProfilePersonalValues {
  firstName: string;
  lastName: string;
  name: string;
  dateOfBirth: string;
  username: string;
  bio: string;
}

interface EditProfilePersonalFieldsProps {
  values: EditProfilePersonalValues;
  onChange: <K extends keyof EditProfilePersonalValues>(
    key: K,
    value: EditProfilePersonalValues[K],
  ) => void;
  currentUsername?: string;
  onUsernameStatusChange: (status: UsernameAvailabilityStatus) => void;
  bioMaxLength: number;
  editable: boolean;
}

export function EditProfilePersonalFields({
  values,
  onChange,
  currentUsername,
  onUsernameStatusChange,
  bioMaxLength,
  editable,
}: EditProfilePersonalFieldsProps) {
  const { t } = useTranslation();
  const bioOverLimit = values.bio.length > bioMaxLength;

  return (
    <View className="px-6 gap-4 py-4">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextInput
            label={t("editProfile.personal.firstName")}
            value={values.firstName}
            onChangeText={(value) => onChange("firstName", value)}
            placeholder={t("editProfile.personal.firstNamePlaceholder")}
            placeholderTextColor={PLACEHOLDER_COLOR}
            autoCapitalize="words"
            maxLength={250}
            returnKeyType="next"
            editable={editable}
          />
        </View>
        <View className="flex-1">
          <TextInput
            label={t("editProfile.personal.lastName")}
            value={values.lastName}
            onChangeText={(value) => onChange("lastName", value)}
            placeholder={t("editProfile.personal.lastNamePlaceholder")}
            placeholderTextColor={PLACEHOLDER_COLOR}
            autoCapitalize="words"
            maxLength={250}
            returnKeyType="next"
            editable={editable}
          />
        </View>
      </View>

      <TextInput
        label={t("editProfile.personal.displayName")}
        value={values.name}
        onChangeText={(value) => onChange("name", value)}
        placeholder={t("editProfile.personal.displayNamePlaceholder")}
        placeholderTextColor={PLACEHOLDER_COLOR}
        autoCapitalize="words"
        returnKeyType="next"
        editable={editable}
      />

      <UsernameField
        value={values.username}
        onChangeText={(value) => onChange("username", value)}
        currentUsername={currentUsername}
        onStatusChange={onUsernameStatusChange}
      />

      <DateField
        label={t("auth.onboarding.dateOfBirthLabel")}
        placeholder={t("auth.onboarding.dateOfBirthPlaceholder")}
        value={values.dateOfBirth}
        onChange={(value) => onChange("dateOfBirth", value)}
      />

      <TextInput
        label={t("editProfile.personal.bio")}
        value={values.bio}
        onChangeText={(value) => onChange("bio", value)}
        placeholder={t("editProfile.personal.bioPlaceholder")}
        placeholderTextColor={PLACEHOLDER_COLOR}
        multiline
        maxLength={bioMaxLength}
        numberOfLines={4}
        textAlignVertical="top"
        editable={editable}
        error={
          bioOverLimit
            ? t("editProfile.validation.bioTooLong", { max: bioMaxLength })
            : undefined
        }
      />
    </View>
  );
}
