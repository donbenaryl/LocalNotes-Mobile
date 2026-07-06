import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { LocalNotesText } from "@/components/ui/LocalNotesText";

interface PageTitleHeadingProps {
  stepTitle?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  alignLeft?: boolean;
  hideLogo?: boolean;
  containerClassName?: string;
}

export function PageTitleHeading({
  stepTitle,
  title,
  subtitle,
  description,
  alignLeft = false,
  hideLogo = false,
  containerClassName = '',
}: PageTitleHeadingProps) {
  const { t } = useTranslation();

  return (
    <View className={`w-full ${containerClassName}`}>
      {stepTitle && (
        <Text className="font-geist-semibold text-[11px] tracking-[0.18em] uppercase text-brand mt-6 mb-4">
          {stepTitle}
        </Text>
      )}
      {!hideLogo && (
        <View
          className={`relative mt-2 inset-0 ${alignLeft ? "items-start justify-start" : "items-center justify-center"}`}
          pointerEvents="none"
        >
          <LocalNotesText size="lg" />
          <Text className="italic text-gray-500 dark:text-gray-100 text-lg">
            {t("auth.signIn.logoDescription")}
          </Text>
        </View>
      )}

      <View
        className={`flex-row flex-wrap items-baseline mb-2 w-full ${hideLogo ? "mt-0" : "mt-5"} ${alignLeft ? "justify-start" : "justify-center"}`}
      >
        {title && (
          <Text
            className={`font-geist-bold text-4xl text-ink dark:text-gray-100 leading-tight mr-2 ${alignLeft ? "text-left" : "text-center"}`}
          >
            {title + " "}
            {subtitle && (
              <Text className="text-4xl ml-2 text-brand italic leading-tight">
                {subtitle}
              </Text>
            )}
          </Text>
        )}
        {description && (
          <Text
            className={`text-lg text-gray-500 dark:text-gray-100 leading-tight mt-3 font-light ${alignLeft ? "text-left" : "text-center px-10"}`}
          >
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}
