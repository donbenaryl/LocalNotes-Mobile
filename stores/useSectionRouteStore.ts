import { create } from "zustand";
import type { Href } from "expo-router";

interface SectionRouteStore {
  /**
   * Href of the section page currently on screen, including the active
   * sub-tab. The URL only names the section — SectionPager keeps its tab in
   * local state — so this is the only accurate "where am I" for outside code.
   */
  activeHref: Href | null;
  setActiveHref: (href: Href | null) => void;
}

export const useSectionRouteStore = create<SectionRouteStore>((set) => ({
  activeHref: null,
  setActiveHref: (activeHref) =>
    set((state) => (state.activeHref === activeHref ? state : { activeHref })),
}));
