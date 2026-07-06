import { View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Bell } from "lucide-react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../stores/useAuthStore";
import { getPersonalityGradientColors } from "@/utils/personalityRing";
import { Avatar } from "../Avatar";
import { LocalNotesText } from "../LocalNotesText";

export function GuardedHeader() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { user } = useAuthStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clearAuth();
    router.replace("/sign-in");
  };

  const handleRouteToProfile = () => {
    queryClient.removeQueries({ queryKey: ['profile'] });
    router.push("/profile");
  };

  return (
    <View
      className="bg-page dark:bg-gray-900 px-4 pb-3 flex-row items-center justify-between"
      style={{ paddingTop: insets.top + 8 }}
    >
      <LocalNotesText size="sm" />
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={handleLogout} className="w-10 h-10 rounded-full bg-soft dark:bg-gray-800 items-center justify-center cursor-pointer">
          <Bell size={18} color={colorScheme === "dark" ? "#F3F4F6" : "#141413"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRouteToProfile} className="cursor-pointer">
          <Avatar
            name={user?.fullName ?? "?"}
            src={user?.profileImageUrl ?? undefined}
            size="sm"
            gradientColors={getPersonalityGradientColors(user?.personalityColor)}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
