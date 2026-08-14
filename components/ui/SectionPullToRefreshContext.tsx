import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface SectionPullToRefreshHandler {
  onRefresh: () => void;
  refreshing: boolean;
}

interface SectionPullToRefreshContextValue {
  register: (tabId: string, handler: SectionPullToRefreshHandler | null) => void;
  handler: SectionPullToRefreshHandler | null;
}

const SectionPullToRefreshContext =
  createContext<SectionPullToRefreshContextValue | null>(null);

interface SectionPullToRefreshProviderProps {
  children: ReactNode;
  activeTabId: string;
}

export function SectionPullToRefreshProvider({
  children,
  activeTabId,
}: SectionPullToRefreshProviderProps) {
  const [handler, setHandler] = useState<SectionPullToRefreshHandler | null>(
    null,
  );
  const registryRef = useRef(new Map<string, SectionPullToRefreshHandler>());
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;

  const applyActiveHandler = useCallback(() => {
    const next = registryRef.current.get(activeTabIdRef.current) ?? null;
    setHandler((prev) => {
      if (prev === null && next === null) return prev;
      if (
        prev &&
        next &&
        prev.onRefresh === next.onRefresh &&
        prev.refreshing === next.refreshing
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const register = useCallback(
    (tabId: string, next: SectionPullToRefreshHandler | null) => {
      if (next) {
        registryRef.current.set(tabId, next);
      } else {
        registryRef.current.delete(tabId);
      }
      if (tabId === activeTabIdRef.current) {
        applyActiveHandler();
      }
    },
    [applyActiveHandler],
  );

  useEffect(() => {
    applyActiveHandler();
  }, [activeTabId, applyActiveHandler]);

  const value = useMemo(
    () => ({
      register,
      handler,
    }),
    [register, handler],
  );

  return (
    <SectionPullToRefreshContext.Provider value={value}>
      {children}
    </SectionPullToRefreshContext.Provider>
  );
}

export function useSectionPullToRefresh() {
  const context = useContext(SectionPullToRefreshContext);
  if (!context) {
    throw new Error(
      'useSectionPullToRefresh must be used within SectionPullToRefreshProvider',
    );
  }
  return context;
}

/** Registers a sub-tab refetch with the parent section ScrollView when active. */
export function useRegisterSectionPullToRefresh(
  tabId: string,
  onRefresh: () => void,
  refreshing: boolean,
) {
  const { register } = useSectionPullToRefresh();
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const stableOnRefresh = useCallback(() => {
    onRefreshRef.current();
  }, []);

  useEffect(() => {
    register(tabId, { onRefresh: stableOnRefresh, refreshing });
    return () => register(tabId, null);
  }, [register, tabId, stableOnRefresh, refreshing]);
}
