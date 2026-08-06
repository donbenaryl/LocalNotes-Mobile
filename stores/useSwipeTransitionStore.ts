import { create } from "zustand";

export type SwipeEnterDirection = "left" | "right";

interface SwipeTransitionStore {
  /**
   * How the destination page should enter after a committed swipe.
   * `left` = user swiped left → content slides in from the right.
   * `right` = user swiped right → content slides in from the left.
   */
  enterDirection: SwipeEnterDirection | null;
  /** Pixel translateX where the incoming page should start (peek position). */
  enterFromX: number | null;
  setEnterTransition: (
    direction: SwipeEnterDirection,
    fromX: number,
  ) => void;
  clearEnterTransition: () => void;
}

export const useSwipeTransitionStore = create<SwipeTransitionStore>((set) => ({
  enterDirection: null,
  enterFromX: null,
  setEnterTransition: (enterDirection, enterFromX) =>
    set({ enterDirection, enterFromX }),
  clearEnterTransition: () =>
    set({ enterDirection: null, enterFromX: null }),
}));
