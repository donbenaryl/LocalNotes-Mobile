import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ProfilePullToRefreshHandler {
  onRefresh: () => void;
  refreshing: boolean;
}

interface ProfilePullToRefreshContextValue {
  register: (handler: ProfilePullToRefreshHandler | null) => void;
  handler: ProfilePullToRefreshHandler | null;
}

const ProfilePullToRefreshContext =
  createContext<ProfilePullToRefreshContextValue | null>(null);

interface ProfilePullToRefreshProviderProps {
  children: ReactNode;
}

export function ProfilePullToRefreshProvider({
  children,
}: ProfilePullToRefreshProviderProps) {
  const [handler, setHandler] = useState<ProfilePullToRefreshHandler | null>(
    null,
  );

  const register = useCallback((next: ProfilePullToRefreshHandler | null) => {
    setHandler(next);
  }, []);

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

/** Registers the active profile tab's refetch with the parent chrome ScrollView. */
export function useRegisterProfilePullToRefresh(
  onRefresh: () => void,
  refreshing: boolean,
) {
  const { register } = useProfilePullToRefresh();

  useEffect(() => {
    register({ onRefresh, refreshing });
    return () => register(null);
  }, [register, onRefresh, refreshing]);
}
