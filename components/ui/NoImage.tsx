import { ImageIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { getDominantPersonalityColor } from "@/utils/personalityRing";

type NoImageSize = "xs" | "sm" | "md" | "lg" | "full";
type NoImageAppearance = "gradient" | "flat";

interface NoImageProps {
  personalityColor?: Record<string, number> | null;
  size?: NoImageSize;
  appearance?: NoImageAppearance;
  innerClassName?: string;
  outerClassName?: string;
}

const SIZE_CONFIG: Record<
  NoImageSize,
  {
    outerClassName: string;
    innerClassName: string;
    iconSize: number;
    labelClassName: string;
  }
> = {
  xs: {
    outerClassName: "h-8 w-8 rounded-lg",
    innerClassName: "rounded-[5px]",
    iconSize: 14,
    labelClassName: "text-[5px]",
  },
  sm: {
    outerClassName: "h-12 w-12 rounded-lg",
    innerClassName: "rounded-[7px]",
    iconSize: 18,
    labelClassName: "text-[7px]",
  },
  md: {
    outerClassName: "h-14 w-14 rounded-xl",
    innerClassName: "rounded-[11px]",
    iconSize: 20,
    labelClassName: "text-[8px]",
  },
  lg: {
    outerClassName: "w-full aspect-square rounded-t-4xl",
    innerClassName: "rounded-t-lg",
    iconSize: 32,
    labelClassName: "text-[10px]",
  },
  full: {
    outerClassName: "h-full w-full",
    innerClassName: "",
    iconSize: 28,
    labelClassName: "text-[9px]",
  },
};

export function NoImage({
  personalityColor,
  size = "md",
  appearance = "gradient",
  innerClassName = "",
  outerClassName = "",
}: NoImageProps) {
  const { t } = useTranslation();
  const config = SIZE_CONFIG[size];
  const color = getDominantPersonalityColor(personalityColor);
  const label = t("profile.picks.noImage");
  const outerPadding = appearance === "gradient" ? 1 : 0;
  const containerClassName =
    appearance === "gradient"
      ? `h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900 ${config.innerClassName} ${innerClassName}`
      : `h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800 ${config.innerClassName} ${innerClassName}`;

  return (
    <View
      className={`shrink-0 overflow-hidden ${config.outerClassName} ${outerClassName}`}
      style={{ padding: outerPadding, backgroundColor: appearance === "gradient" ? color : undefined }}
    >
      <View className={containerClassName}>
        <View className="items-center justify-center">
          <ImageIcon size={config.iconSize} color={color} />
          <Text
            className={`font-geist-medium ${config.labelClassName}`}
            style={{ color }}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}
