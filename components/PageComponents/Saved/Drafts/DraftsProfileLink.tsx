import { Pressable, Text, View } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { resolveUserLabels } from "@/utils/userDisplayName";

export function DraftsProfileLink() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <Pressable
      onPress={() => router.push("/(app)/(stack)/profile" as never)}
      className="mb-6 cursor-pointer"
    >
      <View className="flex-row items-center gap-3 rounded-xl border border-gray-200 bg-soft px-3.5 py-3 dark:border-dk-border dark:bg-dk-card">
        <Avatar
          name={
            resolveUserLabels({
              username: user?.username,
              firstName: user?.firstName,
              lastName: user?.lastName,
              name: user?.fullName,
            }).primary
          }
          src={user?.profileImageUrl ?? undefined}
          size="sm"
        />
        <Text className="flex-1 font-geist text-xs leading-4 text-gray-500 dark:text-dk-muted">
          {t("saved.drafts.profileLinkText")}
        </Text>
        <ChevronRight size={16} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}
