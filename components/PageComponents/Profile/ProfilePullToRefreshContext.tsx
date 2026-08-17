import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ProfilePullToRefreshHandler {
  onRefresh: () => void;
  refreshing: boolean;
}

interface ProfilePullToRefreshContextValue {
  register: (tabId: string, handler: ProfilePullToRefreshHandler | null) => void;
  handler: ProfilePullToRefreshHandler | null;
}

const ProfilePullToRefreshContext =
  createContext<ProfilePullToRefreshContextValue | null>(null);

interface ProfilePullToRefreshProviderProps {
  children: ReactNode;
  activeTabId: string;
}

export function ProfilePullToRefreshProvider({
  children,
  activeTabId,
}: ProfilePullToRefreshProviderProps) {
  const [handler, setHandler] = useState<ProfilePullToRefreshHandler | null>(
    null,
  );
  const registryRef = useRef(new Map<string, ProfilePullToRefreshHandler>());
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
    (tabId: string, next: ProfilePullToRefreshHandler | null) => {
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
    <ProfilePullToRefreshContext.Provider value={value}>
      {children}
    </ProfilePullToRefreshContext.Provider>
  );
}

export function useProfilePullToRefresh() {
  const context = useContext(ProfilePullToRefreshContext);
  if (!context) {
    throw new Error(
      "useProfilePullToRefresh must be used within ProfilePullToRefreshProvider",
    );
  }
  return context;
}

/** Registers a profile sub-tab refetch with the parent chrome ScrollView when active. */
export function useRegisterProfilePullToRefresh(
  tabId: string,
  onRefresh: () => void,
  refreshing: boolean,
) {
  const { register } = useProfilePullToRefresh();
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
