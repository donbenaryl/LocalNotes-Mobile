import { PageSectionTitle } from "@/components/ui/PageSectionTitle";
import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <View className={`mb-4 ${className ?? ""}`}>
      <PageSectionTitle className="px-6 pb-4">{title}</PageSectionTitle>
      <View className="overflow-hidden rounded-2xl bg-paper dark:bg-gray-900 px-6">
        {children}
      </View>
    </View>
  );
}
