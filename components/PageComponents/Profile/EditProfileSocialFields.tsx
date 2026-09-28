import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TextInput } from "@/components/ui/TextInput";

const PLACEHOLDER_COLOR = "#6B7280";

export interface EditProfileSocialValues {
  urlLinkedin: string;
  urlFacebook: string;
  urlInstagram: string;
}

interface EditProfileSocialFieldsProps {
  values: EditProfileSocialValues;
  onChange: (key: keyof EditProfileSocialValues, value: string) => void;
  editable: boolean;
}

export function EditProfileSocialFields({
  values,
  onChange,
  editable,
}: EditProfileSocialFieldsProps) {
  const { t } = useTranslation();

  const fields: {
    key: keyof EditProfileSocialValues;
    label: string;
    placeholder: string;
  }[] = [
    {
      key: "urlLinkedin",
      label: t("editProfile.social.linkedin"),
      placeholder: "https://linkedin.com/in/username",
    },
    {
      key: "urlFacebook",
      label: t("editProfile.social.facebook"),
      placeholder: "https://facebook.com/username",
    },
    {
      key: "urlInstagram",
      label: t("editProfile.social.instagram"),
      placeholder: "https://instagram.com/username",
    },
  ];

  return (
    <View className="px-6 gap-4 py-4">
      <Text className="font-geist text-sm text-gray-500 dark:text-gray-400">
        {t("editProfile.social.helper")}
      </Text>
      {fields.map((field, index) => (
        <TextInput
          key={field.key}
          label={field.label}
          value={values[field.key]}
          onChangeText={(value) => onChange(field.key, value)}
          placeholder={field.placeholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={index === fields.length - 1 ? "done" : "next"}
          editable={editable}
        />
      ))}
    </View>
  );
}
