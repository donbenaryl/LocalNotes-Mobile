import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppScrollView } from "@/components/ui/AppScrollView";
import { AppRefreshControl } from "@/components/ui/AppRefreshControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileActivityData } from "@/hooks/useProfileActivityData";
import { ProfileActivityTab } from "./ProfileActivityTab";

export default function RecentActivityFeed() {
  const { t } = useTranslation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { refetchAll, isRefetching } = useProfileActivityData(userId ?? "");

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t("settings.recentActivityFeed")}
        onBack={() => router.back()}
      />
      <AppScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
        refreshControl={
          userId ? (
            <AppRefreshControl
              refreshing={isRefetching}
              onRefresh={refetchAll}
            />
          ) : undefined
        }
      >
        {userId ? <ProfileActivityTab userId={userId} /> : null}
      </AppScrollView>
    </View>
  );
}
