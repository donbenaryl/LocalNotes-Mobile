import { create } from "zustand";
import type { Href } from "expo-router";
import {
  getSectionId,
  type SectionId,
} from "@/constants/swipeNavigation";

interface SectionRouteStore {
  /**
   * Href of the section page currently on screen, including the active
   * sub-tab. The URL only names the section — SectionPager keeps its tab in
   * local state — so this is the only accurate "where am I" for outside code.
   * Only updated while that section is focused (eager-mounted siblings must
   * not overwrite this).
   */
  activeHref: Href | null;
  /**
   * Last visited page within each footer section. Footer taps and cross-section
   * swipes restore from here instead of always jumping to SECTION_ENTRY_HREF.
   */
  lastHrefBySection: Partial<Record<SectionId, Href>>;
  setActiveHref: (href: Href | null) => void;
  rememberSectionHref: (href: Href) => void;
}

export const useSectionRouteStore = create<SectionRouteStore>((set) => ({
  activeHref: null,
  lastHrefBySection: {},
  setActiveHref: (activeHref) =>
    set((state) => {
      if (state.activeHref === activeHref) return state;
      if (!activeHref) return { ...state, activeHref: null };

      const section = getSectionId(String(activeHref));
      if (!section) return { ...state, activeHref };

      return {
        activeHref,
        lastHrefBySection: {
          ...state.lastHrefBySection,
          [section]: activeHref,
        },
      };
    }),
  rememberSectionHref: (href) =>
    set((state) => {
      const section = getSectionId(String(href));
      if (!section) return state;
      if (state.lastHrefBySection[section] === href) return state;
      return {
        ...state,
        lastHrefBySection: {
          ...state.lastHrefBySection,
          [section]: href,
        },
      };
    }),
}));
