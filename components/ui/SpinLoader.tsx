import { ActivityIndicator, View } from "react-native";
import { BRAND } from "@/constants/colors";
import { cn } from "@/utils/cn";

interface SpinLoaderProps {
  size?: "small" | "large";
  className?: string;
}

export function SpinLoader({ size = "small", className }: SpinLoaderProps) {
  return (
    <View className={cn("items-center py-4", className)}>
      <ActivityIndicator size={size} color={BRAND} />
    </View>
  );
}
