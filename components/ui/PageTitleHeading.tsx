import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { LNText } from "@/components/ui/LNText";
import { LocalNotesText } from "@/components/ui/LocalNotesText";

type PageTitleHeadingTone = "default" | "cream";

interface PageTitleHeadingProps {
  stepTitle?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  alignLeft?: boolean;
  hideLogo?: boolean;
  /** Stack title and italic subtitle on separate lines (welcome hero). */
  stackTitle?: boolean;
  /** Cream-on-dark for photo backgrounds. */
  tone?: PageTitleHeadingTone;
  containerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  descriptionClassName?: string;
}

export function PageTitleHeading({
  stepTitle,
  title,
  subtitle,
  description,
  alignLeft = false,
  hideLogo = false,
  stackTitle = false,
  tone = "default",
  containerClassName = "",
  titleClassName = "",
  subtitleClassName = "",
  descriptionClassName = "",
}: PageTitleHeadingProps) {
  const { t } = useTranslation();
  const isCream = tone === "cream";

  const titleToneClass = isCream
    ? "text-[#F3EBDD]"
    : "text-ink dark:text-dk-text";
  const subtitleToneClass = isCream
    ? "text-[#F3EBDD]"
    : "text-brand dark:text-dk-text";
  const descriptionToneClass = isCream
    ? "text-[rgba(243,235,221,0.86)]"
    : "text-gray-500 dark:text-dk-text";
  const stepToneClass = isCream
    ? "text-[rgba(243,235,221,0.82)]"
    : "text-brand dark:text-dk-text";

  const alignClass = alignLeft ? "text-left" : "text-center";
  const justifyClass = alignLeft ? "justify-start" : "justify-center";

  return (
    <View className={`w-full ${containerClassName}`}>
      {stepTitle && (
        <LNText
          className={`font-geist-semibold text-[11px] tracking-[0.18em] uppercase mt-6 mb-4 ${stepToneClass}`}
        >
          {stepTitle}
        </LNText>
      )}
      {!hideLogo && (
        <View
          className={`relative mt-2 inset-0 ${alignLeft ? "items-start justify-start" : "items-center justify-center"}`}
          pointerEvents="none"
        >
          <LocalNotesText size="lg" />
          <LNText className="italic text-gray-500 dark:text-dk-text text-lg">
            {t("auth.signIn.logoDescription")}
          </LNText>
        </View>
      )}

      <View
        className={`mb-2 w-full ${hideLogo ? "mt-0" : "mt-5"} ${
          stackTitle ? "" : `flex-row flex-wrap items-baseline ${justifyClass}`
        }`}
      >
        {title &&
          (stackTitle ? (
            <View className={alignLeft ? "items-start" : "items-center"}>
              <LNText
                className={`font-geist-semibold text-[42px] leading-[44px] tracking-[-0.025em] ${titleToneClass} ${alignClass} ${titleClassName}`}
                style={
                  isCream
                    ? {
                        textShadowColor: "rgba(26,23,20,0.45)",
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: 18,
                      }
                    : undefined
                }
              >
                {title}
              </LNText>
              {subtitle ? (
                <LNText
                  className={`font-fraunces italic text-[42px] leading-[44px] tracking-[-0.01em] ${subtitleToneClass} ${alignClass} ${subtitleClassName}`}
                  style={
                    isCream
                      ? {
                          textShadowColor: "rgba(26,23,20,0.45)",
                          textShadowOffset: { width: 0, height: 2 },
                          textShadowRadius: 18,
                        }
                      : undefined
                  }
                >
                  {subtitle}
                </LNText>
              ) : null}
            </View>
          ) : (
            <LNText
              className={`font-geist-bold text-4xl leading-tight mr-2 ${titleToneClass} ${alignClass} ${titleClassName}`}
            >
              {title + " "}
              {subtitle && (
                <LNText
                  className={`text-4xl ml-2 italic leading-tight ${subtitleToneClass} ${subtitleClassName}`}
                >
                  {subtitle}
                </LNText>
              )}
            </LNText>
          ))}
        {description && (
          <LNText
            className={`text-[15px] leading-[21px] mt-2.5 font-geist ${descriptionToneClass} ${
              alignLeft ? "text-left" : "text-center px-10"
            } ${descriptionClassName}`}
          >
            {description}
          </LNText>
        )}
      </View>
    </View>
  );
}
