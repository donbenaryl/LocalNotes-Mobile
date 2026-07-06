import { ReactNode } from "react";
import { Text } from "react-native";

interface PageSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function PageSectionTitle({
  children,
  className = "",
}: PageSectionTitleProps) {
  return (
    <Text
      className={`font-geist-bold text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400 ${className}`}
    >
      {children}
    </Text>
  );
}
