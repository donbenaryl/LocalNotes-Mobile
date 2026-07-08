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
        "rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 overflow-hidden",
        isSelected && "border-brand bg-orange-50 dark:border-brand",
        className,
      )}
    >
      {children}
    </View>
  );
}