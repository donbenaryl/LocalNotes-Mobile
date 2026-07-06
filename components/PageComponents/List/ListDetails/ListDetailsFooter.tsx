import { useState } from "react";
import { Pressable, View } from "react-native";
import { Bookmark, MoreHorizontal, Share2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BottomWrapper } from "@/components/ui/BottomWrapper";
import { LocalNotesButton } from "@/components/ui/LocalNotesButton";
import { toast } from "@/components/ui/Toast";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO } from "@/http/list-api/types";

interface ListDetailsFooterProps {
  list: ListItemDAO;
  onSavedChange?: (isSaved: boolean, saves: number) => void;
}

export function ListDetailsFooter({
  list,
  onSavedChange,
}: ListDetailsFooterProps) {
  const { t } = useTranslation();
  const [isSaved, setIsSaved] = useState(list.is_saved);
  const [saves, setSaves] = useState(list.saves ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await listService.saveUnsaveList(list.id);
      const nextSaved = !isSaved;
      const nextSaves = nextSaved ? saves + 1 : Math.max(0, saves - 1);
      setIsSaved(nextSaved);
      setSaves(nextSaves);
      onSavedChange?.(nextSaved, nextSaves);
    } catch (error) {
      console.error("Failed to toggle save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await listService.shareList(list.id, null);
      toast.info(t("listDetail.share"), { title: list.name });
    } catch (error) {
      console.error("Failed to share list:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <BottomWrapper>
      <View className="flex-row items-center gap-2">
        <LocalNotesButton
          label=""
          // onPress={() => void handleShare()}
          onPress={() => {
            toast.info(t("alerts.comingSoonMessage"), {
              title: t("alerts.comingSoon"),
            });
          }}
          leftIcon={<Share2 size={16} color="#171717" />}
          isRounded={false}
          variant="light"
          isWidthFull={false}
          loading={isSharing}
        />

        <LocalNotesButton
          label=""
          onPress={() => {
            toast.info(t("alerts.comingSoonMessage"), {
              title: t("alerts.comingSoon"),
            });
          }}
          leftIcon={<MoreHorizontal size={16} color="#171717" />}
          isRounded={false}
          variant="light"
          isWidthFull={false}
        />
 

        <View className="flex-1">
          <LocalNotesButton
            label={isSaved ? t("listDetail.savedList") : t("listDetail.saveList")}
            onPress={() => void handleSave()}
            variant="dark"
            isWidthFull
            loading={isSaving}
            leftIcon={<Bookmark size={14} color="#FFFFFF" />}
          />
        </View>
      </View>
    </BottomWrapper>
  );
}
