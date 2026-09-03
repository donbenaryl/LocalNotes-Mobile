import { useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { Flag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ReportUserSheet } from "./ReportUserSheet";
import { COLORS } from "@/constants/colors";
import type { ReportContentType } from "@/http/account-api/types";

interface ReportFlagButtonProps {
  userId: string;
  displayName: string;
  contentType: ReportContentType;
  contentId: string;
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  /** Notified whenever the report sheet opens/closes, for parents that must hide their own modal while it's up. */
  onOpenChange?: (open: boolean) => void;
}

export function ReportFlagButton({
  userId,
  displayName,
  contentType,
  contentId,
  size = 16,
  className,
  style,
  hitSlop,
  onOpenChange,
}: ReportFlagButtonProps) {
  const { t } = useTranslation();
  const [reportOpen, setReportOpen] = useState(false);

  const openReport = () => {
    setReportOpen(true);
    onOpenChange?.(true);
  };

  const closeReport = () => {
    setReportOpen(false);
    onOpenChange?.(false);
  };

  return (
    <>
      <Pressable
        onPress={openReport}
        accessibilityRole="button"
        accessibilityLabel={t("listDetail.report")}
        className={className}
        style={style}
        hitSlop={hitSlop}
      >
        <Flag size={size} color={COLORS.error} />
      </Pressable>

      <ReportUserSheet
        visible={reportOpen}
        onClose={closeReport}
        userId={userId}
        displayName={displayName}
        contentType={contentType}
        contentId={contentId}
      />
    </>
  );
}
