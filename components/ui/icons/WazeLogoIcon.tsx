import { Image } from "react-native";

export function WazeLogoIcon() {
  return (
    <Image
      source={require("@/assets/icons/waze-logo.png")}
      style={{ width: 18, height: 18 }}
      resizeMode="contain"
    />
  );
}
