import { RefreshControl, type RefreshControlProps } from "react-native";
import { BRAND } from "@/constants/colors";

interface AppRefreshControlProps
  extends Pick<RefreshControlProps, "refreshing" | "onRefresh" | "enabled"> {}

export function AppRefreshControl({
  refreshing,
  onRefresh,
  enabled,
}: AppRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      enabled={enabled}
      tintColor={BRAND}
      colors={[BRAND]}
    />
  );
}
