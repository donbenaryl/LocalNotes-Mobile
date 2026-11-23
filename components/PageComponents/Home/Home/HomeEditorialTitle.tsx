import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

interface HomeEditorialTitleProps {
  timePhrase: string;
  city: string | null;
}

export function HomeEditorialTitle({
  timePhrase,
  city,
}: HomeEditorialTitleProps) {
  const { t } = useTranslation();

  const titlePrefix = city
    ? t("home.editorial.title", { timePhrase, city })
    : t("home.editorial.titleAll", { timePhrase });

  return (
    <View className="mb-4">
      <Text className="font-geist-extrabold text-3xl leading-[1.05] tracking-tight text-ink dark:text-dk-text">
        Picked for you
      </Text>
      {/* <Text className="font-fraunces text-3xl italic leading-[1.05] tracking-tight text-brand dark:text-dk-text mt-1"> */}
      <Text className="font-geist-medium tracking-tight text-gray-500 dark:text-dk-muted">
        Based on your activity and preferences
      </Text>
    </View>
  );
}
