import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AppScrollView } from "@/components/ui/AppScrollView";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/ui/PageHeader";
import accountService from "@/http/account-api/account.services";
import { useToastStore } from "@/stores/useToastStore";

export default function BlockedUsersSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: async () => {
      const response = await accountService.fetchBlockedUsers();
      return response.data?.data ?? [];
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (userId: string) => accountService.unblockUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
      showToast({ type: "success", message: t("accountSettings.privacy.unblockSuccess") });
    },
    onError: () => {
      showToast({ type: "error", message: t("accountSettings.privacy.unblockError") });
    },
  });

  const blocked = data ?? [];

  return (
    <View className="flex-1 bg-page dark:bg-gray-900">
      <PageHeader
        title={t("accountSettings.privacy.blockedUsersTitle")}
        onBack={() => router.back()}
      />
      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
            {t("accountSettings.privacy.blockedUsersLoadError")}
          </Text>
          <Pressable onPress={() => void refetch()} className="active:opacity-70">
            <Text className="font-geist-semibold text-sm text-brand">
              {t("common.continue")}
            </Text>
          </Pressable>
        </View>
      ) : (
        <AppScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-6 pb-10 pt-4"
        >
          {blocked.length === 0 ? (
            <Text className="mt-8 text-center font-geist text-sm text-gray-500 dark:text-gray-400">
              {t("accountSettings.privacy.blockedUsersEmpty")}
            </Text>
          ) : (
            blocked.map((user, index) => {
              const isUnblocking =
                unblockMutation.isPending &&
                unblockMutation.variables === user.id;
              return (
                <View
                  key={user.id}
                  className={`flex-row items-center gap-3 py-3.5 ${
                    index < blocked.length - 1
                      ? "border-b border-gray-100 dark:border-gray-800"
                      : ""
                  }`}
                >
                  <Avatar
                    name={user.name}
                    src={user.profile_image_url ?? undefined}
                    userId={user.id}
                    size="md"
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      className="font-geist-semibold text-[15px] text-ink dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {user.name}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => unblockMutation.mutate(user.id)}
                    disabled={unblockMutation.isPending || isRefetching}
                    className="rounded-full border border-gray-200 px-3.5 py-2 active:opacity-70 dark:border-gray-700"
                  >
                    {isUnblocking ? (
                      <ActivityIndicator size="small" />
                    ) : (
                      <Text className="font-geist-semibold text-[13px] text-ink dark:text-gray-100">
                        {t("accountSettings.privacy.unblock")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              );
            })
          )}
        </AppScrollView>
      )}
    </View>
  );
}
