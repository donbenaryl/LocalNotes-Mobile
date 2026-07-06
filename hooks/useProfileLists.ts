import { useQuery } from "@tanstack/react-query";
import listService from "@/http/list-api/list.service";
import type { ListItemDAO } from "@/http/list-api/types";

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
    isPending,
    isError,
    refetch,
  };
}
