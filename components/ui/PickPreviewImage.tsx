import { Image, View } from "react-native";
import { NoImage } from "@/components/ui/NoImage";
import { useImageGradientColor } from "@/hooks/useImageGradientColor";

interface PickPreviewImageProps {
  imageUrl: string | null;
  index: number;
  personalityColor?: Record<string, number> | null;
}

const GRADIENT_FILL = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

export function PickPreviewImage({
  imageUrl,
  index,
  personalityColor,
}: PickPreviewImageProps) {
  const gradientRgb = useImageGradientColor(imageUrl);

  return (
    <View className="relative h-11 w-11 rounded-lg shrink-0 overflow-hidden  bg-gray-100 dark:bg-gray-800">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <NoImage
          personalityColor={personalityColor}
          size="sm"
          appearance="flat"
          outerClassName="h-full w-full !bg-white !rounded-0"
          innerClassName="bg-white dark:bg-gray-800 rounded-0!"
        />
      )}
    </View>
  );
}
