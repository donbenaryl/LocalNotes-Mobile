import { RefreshControl, type RefreshControlProps } from "react-native";

const REFRESH_TINT = "#FF6B1A";

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
      tintColor={REFRESH_TINT}
      colors={[REFRESH_TINT]}
    />
  );
}
