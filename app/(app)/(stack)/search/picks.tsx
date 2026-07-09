import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

/** Picks search tab is out of scope for the 05.A–E pass — placeholder only. */
export default function SearchPicksScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-center font-geist text-sm text-gray-500 dark:text-gray-400">
        {t("alerts.comingSoonMessage")}
      </Text>
    </View>
  );
}
