import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { ImageIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { getPersonalityGradientColors } from "@/utils/personalityRing";

type NoImageSize = "sm" | "md" | "lg" | "full";

interface NoImageProps {
  personalityColor?: Record<string, number> | null;
  size?: NoImageSize;
}

const SIZE_CONFIG: Record<
  NoImageSize,
  {
    outerClassName: string;
    innerClassName: string;
    iconSize: number;
    labelClassName: string;
    maskWidth: number;
    maskHeight: number;
  }
> = {
  sm: {
    outerClassName: "h-12 w-12 rounded-lg",
    innerClassName: "rounded-[7px]",
    iconSize: 18,
    labelClassName: "text-[7px]",
    maskWidth: 40,
    maskHeight: 28,
  },
  md: {
    outerClassName: "h-14 w-14 rounded-xl",
    innerClassName: "rounded-[11px]",
    iconSize: 20,
    labelClassName: "text-[8px]",
    maskWidth: 48,
    maskHeight: 32,
  },
  lg: {
    outerClassName: "w-full aspect-square rounded-t-2xl",
    innerClassName: "rounded-t-[15px]",
    iconSize: 32,
    labelClassName: "text-[10px]",
    maskWidth: 72,
    maskHeight: 48,
  },
  full: {
    outerClassName: "h-full w-full",
    innerClassName: "rounded-0",
    iconSize: 28,
    labelClassName: "text-[9px]",
    maskWidth: 64,
    maskHeight: 44,
  },
};

const GRADIENT_START = { x: 0, y: 0 } as const;
const GRADIENT_END = { x: 1, y: 1 } as const;
const GRADIENT_FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function toLinearGradientColors(colors: string[]): [string, string, ...string[]] {
  if (colors.length === 1) {
    return [colors[0], colors[0]];
  }
  return colors.slice(0, 4) as [string, string, ...string[]];
}

export function NoImage({ personalityColor, size = "md" }: NoImageProps) {
  const { t } = useTranslation();
  const config = SIZE_CONFIG[size];
  const gradientColors = toLinearGradientColors(
    getPersonalityGradientColors(personalityColor),
  );
  const label = t("profile.picks.noImage");

  return (
    <View
      className={`shrink-0 overflow-hidden ${config.outerClassName}`}
      style={{ padding: 1 }}
    >
      <LinearGradient
        colors={gradientColors}
        start={GRADIENT_START}
        end={GRADIENT_END}
        style={GRADIENT_FILL}
      />
      <View
        className={`h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-900 ${config.innerClassName}`}
      >
        <MaskedView
          style={{
            height: config.maskHeight,
            width: config.maskWidth,
            alignItems: "center",
            justifyContent: "center",
          }}
          maskElement={
            <View className="items-center justify-center">
              <ImageIcon size={config.iconSize} color="#000000" />
              <Text
                className={`font-geist-medium ${config.labelClassName}`}
                style={{ color: "#000000" }}
              >
                {label}
              </Text>
            </View>
          }
        >
          <LinearGradient
            colors={gradientColors}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={{ width: config.maskWidth, height: config.maskHeight }}
          />
        </MaskedView>
      </View>
    </View>
  );
}
