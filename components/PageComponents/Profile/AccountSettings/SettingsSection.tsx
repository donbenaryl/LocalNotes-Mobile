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
    <View className={`mb-6 ${className ?? ""}`}>
      <PageSectionTitle>{title}</PageSectionTitle>
      <View className="overflow-hidden rounded-2xl bg-paper dark:bg-gray-900">
        {children}
      </View>
    </View>
  );
}
