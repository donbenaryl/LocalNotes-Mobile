import { Image, View } from "react-native";
import { NoImage } from "@/components/ui/NoImage";
import { useImageGradientColor } from "@/hooks/useImageGradientColor";
import { cn } from "@/utils/cn";

type PickPreviewImageSize = "sm" | "md";

interface PickPreviewImageProps {
  imageUrl: string | null;
  index: number;
  personalityColor?: Record<string, number> | null;
  /** `sm` = 36px (default); `md` ≈ 56px for search follow rows. */
  size?: PickPreviewImageSize;
}

const SIZE_CLASS: Record<PickPreviewImageSize, string> = {
  sm: "h-9 w-9 rounded-lg",
  md: "h-14 w-14 rounded-xl",
};

export function PickPreviewImage({
  imageUrl,
  index: _index,
  personalityColor,
  size = "sm",
}: PickPreviewImageProps) {
  useImageGradientColor(imageUrl);

  return (
    <View
      className={cn(
        "relative shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800",
        SIZE_CLASS[size],
      )}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <NoImage
          personalityColor={personalityColor}
          size={size === "md" ? "md" : "xs"}
          appearance="flat"
          outerClassName="h-full w-full !bg-white !rounded-0"
          innerClassName="bg-white dark:bg-gray-800 rounded-0!"
        />
      )}
    </View>
  );
}
