import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Sparkles } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function ComingSoon({ title, description, icon, className }: ComingSoonProps) {
  const { t } = useTranslation();

  return (
    <View className={cn("flex-1 items-center justify-center gap-4 px-8 py-20", className)}>
      <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-tint dark:bg-gray-800">
        {icon ?? <Sparkles size={36} color="#FF6B1A" />}
      </View>
      <View className="items-center gap-1.5">
        <Text className="font-geist-semibold text-lg text-ink dark:text-white">
          {title ?? t("alerts.comingSoon")}
        </Text>
        <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
          {description ?? t("alerts.comingSoonMessage")}
        </Text>
      </View>
    </View>
  );
}
