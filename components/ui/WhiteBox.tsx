import { View } from "react-native";
import { cn } from "@/utils/cn";

interface WhiteBoxProps {
  children: React.ReactNode;
  className?: string;
  isSelected?: boolean;
}

export function WhiteBox({ children, className, isSelected = false }: WhiteBoxProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-gray-200 bg-card p-4 dark:border-dk-line dark:bg-dk-page overflow-hidden",
        isSelected && "border-brand bg-brand-tint dark:border-brand",
        className,
      )}
    >
      {children}
    </View>
  );
}