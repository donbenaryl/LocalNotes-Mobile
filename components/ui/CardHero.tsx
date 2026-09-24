import type { ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { twMerge } from "tailwind-merge";
import { toRgba, useImageGradientColor } from "@/hooks/useImageGradientColor";
import { usePlayableVideoUri } from "@/hooks/usePlayableVideoUri";

interface CardHeroProps {
  /** Poster / still image. Optional when `videoUrl` is set. */
  imageUrl?: string;
  /** When set, muted looping video takes priority over the image. */
  videoUrl?: string;
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

interface HeroVideoPreviewProps {
  uri: string;
}

/** Autoplaying, muted, looped preview for card heroes. */
function HeroVideoPreview({ uri }: HeroVideoPreviewProps) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 h-full w-full"
      style={{ width: "100%", height: "100%" }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
    </View>
  );
}

interface HeroMediaProps {
  imageUrl?: string;
  videoUrl?: string;
  pointerEventsNone: boolean;
}

/** Video (preferred) or image fill for the hero background. */
function HeroMedia({ imageUrl, videoUrl, pointerEventsNone }: HeroMediaProps) {
  const { playableUri, isPreparing } = usePlayableVideoUri(
    videoUrl ?? null,
  );

  if (videoUrl) {
    if (playableUri) {
      return <HeroVideoPreview uri={playableUri} />;
    }

    if (imageUrl) {
      return (
        <Image
          source={{ uri: imageUrl }}
          className="absolute inset-0 h-full w-full"
          resizeMode="cover"
          pointerEvents={pointerEventsNone ? "none" : "auto"}
        />
      );
    }

    return (
      <View className="absolute inset-0 h-full w-full items-center justify-center bg-black">
        {isPreparing ? <ActivityIndicator color="#FFFFFF" /> : null}
      </View>
    );
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className="absolute inset-0 h-full w-full"
        resizeMode="cover"
        pointerEvents={pointerEventsNone ? "none" : "auto"}
      />
    );
  }

  return null;
}

export function CardHero({
  imageUrl,
  videoUrl,
  title,
  subtitle,
  subtitleNode,
  subtitleExtra,
  aspectClassName = "aspect-[16/12]",
  titleSize = "text-3xl",
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
      <HeroMedia
        imageUrl={imageUrl}
        videoUrl={videoUrl}
        pointerEventsNone={Boolean(onPress)}
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
