import { Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/TextInput";

interface TagsProps {
  innerTags: string[];
  innerTagInput: string;
  onInnerTagInputChange: (value: string) => void;
  onAddInnerTag: () => void;
  onRemoveInnerTag: (tag: string) => void;
}

export function Tags({
  innerTags,
  innerTagInput,
  onInnerTagInputChange,
  onAddInnerTag,
  onRemoveInnerTag,
}: TagsProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-1">
      <View className="flex-row justify-between items-center">
        <Text className="font-geist-medium text-sm text-gray-900 dark:text-gray-100">
          {t("profile.picks.vibeTags")}
        </Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {t("profile.picks.vibeTagsHint")}
        </Text>
      </View>
      {innerTags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1 mb-1">
          {innerTags.map((tag) => (
            <Badge
              key={tag}
              label={tag}
              variant="primary"
              rightIcon={
                <Pressable onPress={() => onRemoveInnerTag(tag)} className="cursor-pointer">
                  <X size={12} color="#FF6B1A" />
                </Pressable>
              }
            />
          ))}
        </View>
      ) : null}
      <TextInput
        placeholder={
          innerTags.length
            ? t("profile.picks.addAnotherTag")
            : t("profile.picks.tagPlaceholder")
        }
        value={innerTagInput}
        maxLength={24}
        onChangeText={onInnerTagInputChange}
        onBlur={onAddInnerTag}
        onSubmitEditing={onAddInnerTag}
        returnKeyType="done"
      />
    </View>
  );
}
