import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PageFooterWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageFooterWrapper({
  children,
  className = "",
}: PageFooterWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`absolute bottom-0 left-0 right-0 px-6 pt-3 bg-page dark:bg-dk-page border-t border-gray-200 dark:border-dk-line ${className}`}
      style={{
        zIndex: 10,
        elevation: 10,
        paddingBottom: insets.bottom + 10,
      }}
    >
      {children}
    </View>
  );
}
