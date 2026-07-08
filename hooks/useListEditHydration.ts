import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';
import listService from '@/http/list-api/list.service';
import accountService from '@/http/account-api/account.services';
import { useCategories } from '@/hooks/useProfileList';
import { useListFormStore } from '@/stores/useListFormStore';
import { mapListItemDaoToFormData } from '@/utils/listPickMappers';
import type { searchUserDAO } from '@/http/account-api/types';

interface UseListEditHydrationResult {
  isLoading: boolean;
  isError: boolean;
  selectedUserDetails: searchUserDAO[];
  setSelectedUserDetails: Dispatch<SetStateAction<searchUserDAO[]>>;
}

async function resolveSharedUsers(userIds: string[]): Promise<searchUserDAO[]> {
  if (userIds.length === 0) return [];

  return Promise.all(
    userIds.map(async (userId) => {
      try {
        const response = await accountService.fetchOtherUser(userId);
        const profile = response.data?.data;
        if (profile?.name) {
          return { id: userId, name: profile.name };
        }
      } catch {
        // Fall back to showing the raw id if profile lookup fails.
      }
      return { id: userId, name: userId };
    }),
  );
}

export function useListEditHydration(
  listId?: string,
): UseListEditHydrationResult {
  const sourceListId = useListFormStore((s) => s.sourceListId);
  const hydratedListUpdatedAt = useListFormStore((s) => s.hydratedListUpdatedAt);
  const hydrateFromList = useListFormStore((s) => s.hydrateFromList);
  const { categories, isPending: categoriesLoading } = useCategories();
  const [selectedUserDetails, setSelectedUserDetails] = useState<
    searchUserDAO[]
  >([]);

  const {
    data: list,
    isPending: listLoading,
    isError,
  } = useQuery({
    queryKey: ['list-edit', listId],
    enabled: Boolean(listId),
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const response = await listService.retrieveList(listId!);
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to load list');
      }
      return response.data?.data ?? null;
    },
  });

  useEffect(() => {
    if (!listId || !list || categoriesLoading) {
      return;
    }

    const listVersion = list.updated_at ?? list.created_at;
    const isAlreadyHydrated =
      sourceListId === listId && hydratedListUpdatedAt === listVersion;

    if (isAlreadyHydrated) {
      return;
    }

    hydrateFromList(listId, mapListItemDaoToFormData(list, categories), listVersion);

    let cancelled = false;

    void (async () => {
      const users = await resolveSharedUsers(list.shared_with ?? []);
      if (!cancelled) {
        setSelectedUserDetails(users);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    categories,
    categoriesLoading,
    hydrateFromList,
    hydratedListUpdatedAt,
    list,
    listId,
    sourceListId,
  ]);

  return {
    isLoading: Boolean(listId) && (listLoading || categoriesLoading),
    isError,
    selectedUserDetails,
    setSelectedUserDetails,
  };
}
