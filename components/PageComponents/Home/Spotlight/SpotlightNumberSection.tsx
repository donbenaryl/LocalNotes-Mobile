import { Text } from "react-native";
import { cn } from "@/utils/cn";

interface SpotlightNumberSectionProps {
  children: string;
  quiet?: boolean;
}

export function SpotlightNumberSection({ children, quiet = false }: SpotlightNumberSectionProps) {
  return (
    <Text
      className={cn(
        "font-geist-bold text-xs",
        quiet ? "text-gray-400 dark:text-gray-500" : "text-brand",
      )}
    >
      {children}
    </Text>
  );
}
