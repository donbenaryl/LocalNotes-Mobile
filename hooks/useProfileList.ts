import { useQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import homeService from "@/http/home-api/home.service";
import recommendationsService from "@/http/recommendations-api/recommendations.service";
import type { ListItemDAO, listedDTO } from "@/http/list-api/types";

export type ProfileTabCategory =
  | "my-lists"
  | "saved"
  | "collaborative"
  | "contributed"
  | "recent"
  | "shared-with-me"
  | "picks";

interface UseProfileParams {
  category?: ProfileTabCategory;
  dto: listedDTO;
  selectedCategory?: string;
  enabled?: boolean;
  viewedUserId?: string;
  isOwnProfile?: boolean;
}

export function useProfile({
  category = "my-lists",
  dto,
  selectedCategory,
  enabled = true,
  viewedUserId,
  isOwnProfile = true,
}: UseProfileParams) {
  const isDraftsOrMyLists =
    category === "my-lists" || (category as string) === "draft";
  const categoryFilter =
    selectedCategory && selectedCategory !== "All" ? selectedCategory : undefined;

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: isOwnProfile
      ? isDraftsOrMyLists
        ? ["profile-lists", category, dto.status, categoryFilter ?? ""]
        : ["profile-other-lists", category, categoryFilter ?? ""]
      : isDraftsOrMyLists
        ? ["profile-user-lists", viewedUserId, dto.status, categoryFilter ?? ""]
        : ["profile-other-user-lists", viewedUserId, category, categoryFilter ?? ""],
    enabled:
      enabled &&
      category !== "picks" &&
      category !== "recent" &&
      (isOwnProfile || Boolean(viewedUserId)),
    queryFn: async (): Promise<ListItemDAO[]> => {
      if (!isOwnProfile && viewedUserId) {
        if (isDraftsOrMyLists) {
          const response = await listService.fetchUserLists({ userId: viewedUserId });
          let lists = response.data?.data ?? [];
          if (dto.status) {
            lists = lists.filter(
              (l) => l.status?.toLowerCase() === dto.status.toLowerCase(),
            );
          }
          if (categoryFilter) {
            lists = lists.filter((l) => l.categories?.includes(categoryFilter));
          }
          return lists;
        }
        const response = await listService.fetchOtherLists({
          category,
          user_id: viewedUserId,
          ...(categoryFilter ? { category_id: categoryFilter } : {}),
        });
        return response.data?.data ?? [];
      }

      if (isDraftsOrMyLists) {
        const query: listedDTO = {
          status: dto.status,
          ...(categoryFilter ? { category: categoryFilter } : {}),
        };
        const response = await listService.fetchLists(query);
        return response.data?.data ?? [];
      }
      const response = await listService.fetchOtherLists({
        category,
        ...(categoryFilter ? { category_id: categoryFilter } : {}),
      });
      return response.data?.data ?? [];
    },
  });

  return {
    list: data ?? [],
    isPending,
    isError,
    refetch,
  };
}

export function useProfilePicks(
  favoriteFilter: string,
  enabled = true,
  viewedUserId?: string,
) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: viewedUserId
      ? ["profile-picks", viewedUserId, favoriteFilter]
      : ["profile-picks", favoriteFilter],
    enabled: enabled && (viewedUserId ? Boolean(viewedUserId) : true),
    queryFn: async () => {
      const params =
        favoriteFilter === "Favorites only" ? { is_favorite: true as const } : {};
      const response = await listService.fetchListItems(
        viewedUserId ? { ...params, user_id: viewedUserId } : params,
      );
      return response.data?.data ?? [];
    },
  });

  return {
    picks: data ?? [],
    isPending,
    isError,
    refetch,
  };
}

export function useActivityFeed(enabled = true) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["activity-feed"],
    enabled,
    queryFn: async () => {
      const response = await homeService.fetchActivities();
      return response.data?.data ?? [];
    },
  });

  return {
    activityFeed: data ?? [],
    isPending,
    isError,
    refetch,
  };
}

export function useFollowingLists(enabled = true) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["following-lists"],
    enabled,
    queryFn: async (): Promise<ListItemDAO[]> => {
      const response = await listService.fethFollowingList();
      return response.data?.data ?? [];
    },
  });

  return {
    followingList: data ?? [],
    isPending,
    isError,
    refetch,
  };
}

export function useSimilarUsers(userId: string, enabled = true) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["similar-users", userId],
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const response = await recommendationsService.fetchSimilarUsers(userId);
      return response.data?.data ?? [];
    },
  });

  return {
    similarUsers: data ?? [],
    isPending,
    isError,
    refetch,
  };
}

export function useSimilarLists(enabled = true) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["similar-lists"],
    enabled,
    queryFn: async () => {
      const response = await listService.fethSimilarList();
      return response.data?.data ?? [];
    },
  });

  return {
    similarList: data ?? [],
    isPending,
    isError,
    refetch,
  };
}

export function useCategories() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["list-categories"],
    queryFn: async () => {
      const response = await homeService.fetchCategories();
      return response.data?.data ?? [];
    },
  });

  return {
    categories: data ?? [],
    isPending,
    isError,
  };
}
