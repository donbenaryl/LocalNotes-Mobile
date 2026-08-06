import { useQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO } from "@/http/list-api/types";
import { FEED_STALE_TIME_MS } from "@/constants/queryCache";

interface UseProfileListsParams {
  status?: string;
  category?: string;
  enabled?: boolean;
}

export function useProfileLists({
  status = "Published",
  category,
  enabled = true,
}: UseProfileListsParams = {}) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["profile-lists", status, category ?? ""],
    enabled,
    staleTime: FEED_STALE_TIME_MS,
    queryFn: async (): Promise<ListItemDAO[]> => {
      const response = await listService.fetchLists({
        status,
        ...(category ? { category } : {}),
      });
      return response.data?.data ?? [];
    },
  });

  return {
    lists: data ?? [],
    isPending: isPending && data === undefined,
    isError,
    refetch,
  };
}
