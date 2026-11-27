import { View, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { Bell } from "lucide-react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { resolveUserLabels } from "@/utils/userDisplayName";
import { Avatar } from "../Avatar";
import { LocalNotesText } from "../LocalNotesText";
import { useSplashTarget } from "@/hooks/useSplashTarget";

export function GuardedHeader() {
  const { colorScheme } = useColorScheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const logo = useSplashTarget('home');

  const handleOpenNotifications = () => {
    router.push("/(app)/(stack)/notifications" as never);
  };

  const handleRouteToProfile = () => {
    queryClient.removeQueries({ queryKey: ['profile'] });
    router.push("/profile");
  };

  return (
    <View
      className="bg-page dark:bg-dk-page pt-2 pb-3 flex-row items-center justify-between"
    >
      <View
        ref={logo.ref}
        onLayout={logo.onLayout}
        collapsable={false}
        style={{ opacity: logo.hidden ? 0 : 1 }}
      >
        <LocalNotesText size="sm" />
      </View>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={handleOpenNotifications}
          className="w-10 h-10 rounded-full bg-soft dark:bg-dk-card items-center justify-center cursor-pointer"
        >
          <Bell size={18} color={colorScheme === "dark" ? "#F7F3EC" : "#1A1714"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRouteToProfile} className="cursor-pointer">
          <Avatar
            name={resolveUserLabels({
              username: user?.username,
              firstName: user?.firstName,
              lastName: user?.lastName,
              name: user?.fullName,
            }).primary}
            src={user?.profileImageUrl ?? undefined}
            size="sm"
            gradientColors={getPersonalityGradientColors(user?.personalityColor)}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
