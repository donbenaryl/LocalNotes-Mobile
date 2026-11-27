import { Text } from "react-native";
import { cn } from "@/utils/cn";

export interface SectionLabelProps {
  label: string;
  className?: string;
}

export function SectionLabel({ label, className = "" }: SectionLabelProps) {
  return (
    <Text
      className={cn(
        "font-geist-bold text-[10.5px] uppercase tracking-[0.15em] text-gray-400 dark:text-dk-faint",
        className,
      )}
    >
      {label}
    </Text>
  );
}
