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
        "font-geist-bold text-md",
        quiet ? "text-gray-400 dark:text-dk-faint" : "text-brand dark:text-dk-text",
      )}
    >
      {children}
    </Text>
  );
}
