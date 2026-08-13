import type { ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { twMerge } from "tailwind-merge";
import { toRgba, useImageGradientColor } from "@/hooks/useImageGradientColor";

interface CardHeroProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  /** Replaces string subtitle + subtitleExtra when provided */
  subtitleNode?: ReactNode;
  /** Overflow count shown in peach after the subtitle, e.g. "+1" */
  subtitleExtra?: string;
  /** Size classes — e.g. `aspect-[16/12]` or `h-44` */
  aspectClassName?: string;
  /** Title text size class — e.g. `text-2xl` or `text-4xl` */
  titleSize?: string;
  /** Subtitle text size class — e.g. `text-sm` or `text-md` */
  subtitleSize?: string;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  /** Opens card detail when the hero image/title is tapped (subtitle stays interactive). */
  onPress?: () => void;
  className?: string;
}

const GRADIENT_FILL = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

export function CardHero({
  imageUrl,
  title,
  subtitle,
  subtitleNode,
  subtitleExtra,
  aspectClassName = "aspect-[16/12]",
  titleSize = "text-4xl",
  subtitleSize = "text-md",
  topLeft,
  topRight,
  onPress,
  className,
}: CardHeroProps) {
  const gradientRgb = useImageGradientColor(imageUrl);

  return (
    <View
      className={twMerge(
        "relative w-full overflow-hidden",
        aspectClassName,
        className,
      )}
    >
      <Image
        source={{ uri: imageUrl }}
        className="absolute inset-0 h-full w-full"
        resizeMode="cover"
        pointerEvents={onPress ? "none" : "auto"}
      />

      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          className="absolute inset-0 z-[1] cursor-pointer"
        />
      ) : null}

      <LinearGradient
        colors={[
          toRgba(gradientRgb, 0.9),
          toRgba(gradientRgb, 0.35),
          toRgba(gradientRgb, 0.08),
          toRgba(gradientRgb, 0),
        ]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={GRADIENT_FILL}
        pointerEvents="none"
      />

      {topLeft ? (
        <View className="absolute left-3 top-3 z-10">{topLeft}</View>
      ) : null}

      {topRight ? (
        <View className="absolute right-3 top-3 z-10">{topRight}</View>
      ) : null}

      <View className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-3.5 pt-8" pointerEvents="box-none">
        {title ? (
          onPress ? (
            <Pressable onPress={onPress} accessibilityRole="button" className="cursor-pointer">
              <Text
                className={twMerge(
                  "font-geist-bold capitalize text-white",
                  titleSize,
                )}
                numberOfLines={2}
              >
                {title}
              </Text>
            </Pressable>
          ) : (
            <Text
              className={twMerge(
                "font-geist-bold capitalize text-white",
                titleSize,
              )}
              numberOfLines={2}
            >
              {title}
            </Text>
          )
        ) : null}

        {subtitleNode ? (
          <View className={title ? "mt-0.5" : undefined} pointerEvents="auto">
            {subtitleNode}
          </View>
        ) : subtitle || subtitleExtra ? (
          <View className={twMerge("flex-row flex-wrap items-center", title ? "mt-0.5" : undefined)}>
            {subtitle ? (
              <Text className={twMerge("text-white", subtitleSize)}>
                {subtitle}
              </Text>
            ) : null}
            {subtitleExtra ? (
              <Text className="font-geist-medium text-xs text-[#FFCFA8]">
                {subtitle ? " " : ""}
                {subtitleExtra}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
