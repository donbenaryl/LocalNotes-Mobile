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

interface SectionInfiniteScrollHandler {
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

interface SectionPullToRefreshContextValue {
  register: (tabId: string, handler: SectionPullToRefreshHandler | null) => void;
  registerInfiniteScroll: (
    tabId: string,
    handler: SectionInfiniteScrollHandler | null,
  ) => void;
  handler: SectionPullToRefreshHandler | null;
  infiniteScrollHandler: SectionInfiniteScrollHandler | null;
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
  const [infiniteScrollHandler, setInfiniteScrollHandler] =
    useState<SectionInfiniteScrollHandler | null>(null);
  const registryRef = useRef(new Map<string, SectionPullToRefreshHandler>());
  const infiniteScrollRegistryRef = useRef(
    new Map<string, SectionInfiniteScrollHandler>(),
  );
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

  const applyActiveInfiniteScrollHandler = useCallback(() => {
    const next =
      infiniteScrollRegistryRef.current.get(activeTabIdRef.current) ?? null;
    setInfiniteScrollHandler((prev) => {
      if (prev === null && next === null) return prev;
      if (
        prev &&
        next &&
        prev.onLoadMore === next.onLoadMore &&
        prev.hasNextPage === next.hasNextPage &&
        prev.isFetchingNextPage === next.isFetchingNextPage
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

  const registerInfiniteScroll = useCallback(
    (tabId: string, next: SectionInfiniteScrollHandler | null) => {
      if (next) {
        infiniteScrollRegistryRef.current.set(tabId, next);
      } else {
        infiniteScrollRegistryRef.current.delete(tabId);
      }
      if (tabId === activeTabIdRef.current) {
        applyActiveInfiniteScrollHandler();
      }
    },
    [applyActiveInfiniteScrollHandler],
  );

  useEffect(() => {
    applyActiveHandler();
    applyActiveInfiniteScrollHandler();
  }, [activeTabId, applyActiveHandler, applyActiveInfiniteScrollHandler]);

  const value = useMemo(
    () => ({
      register,
      registerInfiniteScroll,
      handler,
      infiniteScrollHandler,
    }),
    [register, registerInfiniteScroll, handler, infiniteScrollHandler],
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

/** Registers infinite-scroll load-more with the parent section ScrollView when active. */
export function useRegisterSectionInfiniteScroll(
  tabId: string,
  onLoadMore: () => void,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
) {
  const { registerInfiniteScroll } = useSectionPullToRefresh();
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const stableOnLoadMore = useCallback(() => {
    onLoadMoreRef.current();
  }, []);

  useEffect(() => {
    registerInfiniteScroll(tabId, {
      onLoadMore: stableOnLoadMore,
      hasNextPage,
      isFetchingNextPage,
    });
    return () => registerInfiniteScroll(tabId, null);
  }, [
    registerInfiniteScroll,
    tabId,
    stableOnLoadMore,
    hasNextPage,
    isFetchingNextPage,
  ]);
}
