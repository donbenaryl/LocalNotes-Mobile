import { Text, View } from "react-native";

interface MapPinMarkerProps {
  number: number;
  isActive?: boolean;
  /** Soft brand fill for place pins vs ink for list pins. */
  variant?: "default" | "place";
}

/**
 * Numbered map pin shared by list-detail and search maps.
 * Matches the visual language used in ListDetailsMap.
 */
export function MapPinMarker({
  number,
  isActive = false,
  variant = "default",
}: MapPinMarkerProps) {
  const inactiveBg =
    variant === "place" ? "bg-brand" : "bg-ink dark:bg-gray-100";

  return (
    <View className="items-center">
      <View
        className={`h-8 w-8 items-center justify-center rounded-full border-[2.5px] border-white ${
          isActive ? "bg-brand" : inactiveBg
        }`}
      >
        <Text
          className={`font-geist-bold text-[13px] ${
            isActive || variant === "place"
              ? "text-white"
              : "text-white dark:text-ink"
          }`}
        >
          {number}
        </Text>
      </View>
      <View className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-white" />
    </View>
  );
}
