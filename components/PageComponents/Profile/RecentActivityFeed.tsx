import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/stores/useAuthStore";
import { ProfileActivityTab } from "./ProfileActivityTab";

export default function RecentActivityFeed() {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t("settings.recentActivityFeed")}
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        {userId ? <ProfileActivityTab userId={userId} /> : null}
      </ScrollView>
    </View>
  );
}
