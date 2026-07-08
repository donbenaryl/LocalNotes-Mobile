import { Image } from "react-native";
import wazeLogo from "@/assets/icons/waze-logo.png";

export function WazeLogoIcon() {
  return (
    <Image
      source={wazeLogo}
      style={{ width: 18, height: 18 }}
      resizeMode="contain"
    />
  );
}
