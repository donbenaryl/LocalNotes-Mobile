import { Text } from "react-native";
import { cn } from "@/utils/cn";

interface SpotlightSectionTitleProps {
  children: string;
  quiet?: boolean;
}

export function SpotlightSectionTitle({ children, quiet = false }: SpotlightSectionTitleProps) {
  return (
    <Text
      className={cn(
        "italic text-[15.5px]",
        quiet ? "text-gray-400 dark:text-gray-500" : "text-ink dark:text-gray-100",
      )}
    >
      {children}
    </Text>
  );
}
