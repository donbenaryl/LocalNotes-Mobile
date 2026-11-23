import { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Info } from "lucide-react-native";

interface PageSectionTitleProps {
  children: ReactNode;
  className?: string;
  /** Optional help content (text or elements) shown in a panel when the info icon is pressed. */
  info?: ReactNode;
  /** Optional content aligned to the right of the title row. */
  right?: ReactNode;
}

export function PageSectionTitle({
  children,
  className = "",
  info,
  right,
}: PageSectionTitleProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const title = (
    <Text
      className={`font-geist-bold text-[11px] uppercase tracking-widest text-gray-500 dark:text-dk-muted ${className}`}
    >
      {children}
    </Text>
  );

  if (!info && !right) return title;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {title}
          {info ? (
            <Pressable
              onPress={() => setIsInfoOpen((open) => !open)}
              hitSlop={8}
              accessibilityRole="button"
              className="cursor-pointer"
            >
              <Info size={15} color={isInfoOpen ? "#1A1714" : "#9CA3AF"} />
            </Pressable>
          ) : null}
        </View>
        {right}
      </View>
      {info && isInfoOpen ? (
        <View className="rounded-2xl bg-soft px-4 py-3 dark:bg-dk-card">
          {typeof info === "string" ? (
            <Text className="font-geist text-[13px] text-gray-600 dark:text-dk-body">
              {info}
            </Text>
          ) : (
            info
          )}
        </View>
      ) : null}
    </View>
  );
}
