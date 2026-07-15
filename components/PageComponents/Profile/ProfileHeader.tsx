import { useMemo } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Moon, Settings, Sparkles, Sun, Tv } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "react-i18next";
import {
  CardOptionsMenu,
  type CardOptionsMenuItem,
} from "@/components/ui/CardOptionsMenu";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";

export function ProfileHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";

  const themeLabel = isDark ? t("settings.darkMode") : t("settings.lightMode");

  const items = useMemo<CardOptionsMenuItem[]>(
    () => [
      {
        kind: "action",
        key: "theme",
        label: themeLabel,
        icon: isDark ? Sun : Moon,
        onPress: () => {
          void setTheme(isDark ? "light" : "dark");
        },
      },
      {
        kind: "action",
        key: "recent-activity",
        label: t("settings.recentActivityFeed"),
        icon: Tv,
        onPress: () => {
          router.push("/(app)/(stack)/recent-activity");
        },
      },
      {
        kind: "action",
        key: "account-settings",
        label: t("settings.accountSettings"),
        icon: Settings,
        onPress: () => {
          router.push("/(app)/(stack)/profile/account-settings");
        },
      },
      {
        kind: "action",
        key: "retake-personality-test",
        label: t("settings.retakePersonalityTest"),
        icon: Sparkles,
        onPress: () => {
          router.push({
            pathname: "/personality",
            params: { isRetake: "true" },
          });
        },
      },
      {
        kind: "action",
        key: "logout",
        label: t("settings.logout"),
        icon: LogOut,
        variant: "destructive",
        onPress: async () => {
          queryClient.removeQueries({ queryKey: ["profile"] });
          await clearAuth();
          router.replace("/sign-in");
        },
      },
    ],
    [clearAuth, isDark, queryClient, router, setTheme, t, themeLabel],
  );

  return <CardOptionsMenu items={items} />;
}
