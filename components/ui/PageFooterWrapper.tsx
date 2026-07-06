import type { ReactNode } from "react";
import { View } from "react-native";

interface PageFooterWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageFooterWrapper({
  children,
  className = "",
}: PageFooterWrapperProps) {
  return (
    <View
      className={`absolute bottom-0 left-0 right-0 px-6 pt-3 pb-6 bg-page dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 ${className}`}
      style={{ zIndex: 10, elevation: 10 }}
    >
      {children}
    </View>
  );
}
