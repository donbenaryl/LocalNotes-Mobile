import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileVitalBar } from "./ProfileVitalBar";
import { useProfileChrome } from "./ProfileChromeProvider";
import type { profileItemDAO } from "@/http/account-api/types";

interface ProfileChromeHeaderProps {
  onBack: () => void;
  rightChild?: ReactNode;
  profile: profileItemDAO | null | undefined;
  isOwnProfile: boolean;
  isPending: boolean;
}

export function ProfileChromeHeader({
  onBack,
  rightChild,
  profile,
  isOwnProfile,
  isPending,
}: ProfileChromeHeaderProps) {
  const { hideProgress } = useProfileChrome();
  const [pageHeaderInteractive, setPageHeaderInteractive] = useState(true);

  useAnimatedReaction(
    () => hideProgress.value < 0.99,
    (visible, prev) => {
      if (visible === prev) return;
      runOnJS(setPageHeaderInteractive)(visible);
    },
    [hideProgress],
  );

  const pageHeaderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hideProgress.value, [0, 1], [1, 0]),
    transform: [
      { translateY: interpolate(hideProgress.value, [0, 1], [0, -8]) },
    ],
  }));

  return (
    <View className="relative z-10">
      <Animated.View
        style={pageHeaderAnimatedStyle}
        pointerEvents={pageHeaderInteractive ? "auto" : "none"}
        accessibilityElementsHidden={!pageHeaderInteractive}
        importantForAccessibility={
          pageHeaderInteractive ? "yes" : "no-hide-descendants"
        }
      >
        <PageHeader onBack={onBack} borderless rightChild={rightChild} />
      </Animated.View>
      {!isPending && profile ? (
        <View
          style={StyleSheet.absoluteFillObject}
          pointerEvents="box-none"
          className="z-20"
        >
          <ProfileVitalBar profile={profile} isOwnProfile={isOwnProfile} />
        </View>
      ) : null}
    </View>
  );
}
