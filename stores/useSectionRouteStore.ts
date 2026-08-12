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
   * Href of the section we just left when requestSection flips sections.
   * Used when entering Search after activeHref has already been overwritten
   * by the incoming section's pager (returnTo race).
   */
  exitHref: Href | null;
  /**
   * Last visited page within each footer section. Footer taps and cross-section
   * swipes restore from here instead of always jumping to SECTION_ENTRY_HREF.
   */
  lastHrefBySection: Partial<Record<SectionId, Href>>;
  /**
   * Footer section the UI treats as active. Set optimistically the instant a
   * tap or swipe commits, ahead of the router — pathname only lands a frame or
   * more later. Null until the first navigation resolves; consumers fall back
   * to getSectionId(pathname) meanwhile.
   */
  activeSection: SectionId | null;
  /**
   * Section we moved to optimistically, still waiting on the router. While set,
   * pathname must not overwrite activeSection or the highlight would snap back.
   */
  pendingSection: SectionId | null;
  /**
   * Bumped by a re-tap of the active footer tab. Sub-tabs never appear in the
   * URL, so a router.navigate to the section root is a no-op — sections watch
   * their own token instead and reset to their first sub-tab.
   */
  sectionResetTokens: Partial<Record<SectionId, number>>;
  setActiveHref: (href: Href | null) => void;
  rememberSectionHref: (href: Href) => void;
  requestSection: (to: SectionId) => void;
  syncSectionFromPathname: (pathSection: SectionId) => void;
  resetSectionTab: (section: SectionId) => void;
}

export const useSectionRouteStore = create<SectionRouteStore>((set) => ({
  activeHref: null,
  exitHref: null,
  lastHrefBySection: {},
  activeSection: null,
  pendingSection: null,
  sectionResetTokens: {},
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
  requestSection: (to) =>
    set((state) =>
      state.activeSection === to
        ? state
        : {
            ...state,
            activeSection: to,
            pendingSection: to,
            exitHref: state.activeHref,
          },
    ),
  syncSectionFromPathname: (pathSection) =>
    set((state) => {
      if (state.pendingSection) {
        // Router still catching up — hold the optimistic value.
        if (state.pendingSection !== pathSection) return state;
        return { ...state, pendingSection: null, activeSection: pathSection };
      }
      if (state.activeSection === pathSection) return state;
      // Deep link or hardware back: the router moved without us.
      return { ...state, activeSection: pathSection };
    }),
  resetSectionTab: (section) =>
    set((state) => ({
      ...state,
      sectionResetTokens: {
        ...state.sectionResetTokens,
        [section]: (state.sectionResetTokens[section] ?? 0) + 1,
      },
    })),
}));
