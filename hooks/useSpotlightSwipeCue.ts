import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SWIPE_CUE_STORAGE_KEY = "spotlight_picks_swipe_cue_seen";
const SWIPE_CUE_AUTO_DISMISS_MS = 4000;

/** First-visit-only "Swipe" cue on the Picks carousel: shown once, dismissed
 * on first scroll or after 4s, then never again (persisted flag). */
export function useSpotlightSwipeCue() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SWIPE_CUE_STORAGE_KEY).then((seen) => {
      if (!cancelled && seen !== "1") setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible((current) => {
      if (!current) return current;
      AsyncStorage.setItem(SWIPE_CUE_STORAGE_KEY, "1").catch(() => {});
      return false;
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(dismiss, SWIPE_CUE_AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [visible, dismiss]);

  return { visible, dismiss };
}
