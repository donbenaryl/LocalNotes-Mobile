import { ActivityIndicator, View } from "react-native";
import { cn } from "@/utils/cn";

const BRAND_COLOR = "#FF6B1A";

interface SpinLoaderProps {
  size?: "small" | "large";
  className?: string;
}

export function SpinLoader({ size = "small", className }: SpinLoaderProps) {
  return (
    <View className={cn("items-center py-4", className)}>
      <ActivityIndicator size={size} color={BRAND_COLOR} />
    </View>
  );
}
