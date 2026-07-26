import { useState } from "react";
import listService from "@/http/list-api/list.service";
import spotlightService from "@/http/spotlight-api/spotlight.service";

export function useSpotlightListSave(
  listId: string,
  initialSaveCount: number,
  spotlightItemId: string | null = null,
) {
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(initialSaveCount);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const previousSaved = isSaved;
    const previousCount = saveCount;
    const nextSaved = !previousSaved;

    setIsSaved(nextSaved);
    setSaveCount(nextSaved ? previousCount + 1 : Math.max(0, previousCount - 1));

    try {
      await listService.saveUnsaveList(listId);
      if (nextSaved && spotlightItemId) {
        void spotlightService.logSaveEvent(spotlightItemId);
      }
    } catch (error) {
      console.error("Failed to toggle Spotlight list save:", error);
      setIsSaved(previousSaved);
      setSaveCount(previousCount);
    } finally {
      setIsSaving(false);
    }
  };

  return { isSaved, saveCount, isSaving, toggle };
}
