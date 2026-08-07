import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import accountService from '@/http/account-api/account.services';
import type { notificationItemDAO } from '@/http/account-api/types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_COUNT_QUERY_KEY = ['notifications', 'count'] as const;

export type NotificationFilter =
  | 'all'
  | 'mentions'
  | 'saves'
  | 'new_lists'
  | 'offers';

/** `null` = show all types. */
const FILTER_TYPE_MAP: Record<NotificationFilter, string[] | null> = {
  all: null,
  mentions: ['COMMENT_MENTION'],
  saves: ['LIST_WAS_SAVED'],
  new_lists: ['FOLLOWED_USER_NEW_LIST', 'FOLLOWED_USER_LIST_UPDATED'],
  offers: [
    'SPOTLIGHT_FEATURED',
    'BUSINESS_VIEWED',
    'FOLLOWED_BUSINESS_NEW_OFFER',
  ],
};

export function filterNotifications(
  items: notificationItemDAO[],
  filter: NotificationFilter,
): notificationItemDAO[] {
  const types = FILTER_TYPE_MAP[filter];
  if (types === null) return items;
  return items.filter((item) => types.includes(item.notification_type));
}

export function groupNotifications(items: notificationItemDAO[]): {
  unread: notificationItemDAO[];
  read: notificationItemDAO[];
} {
  const unread: notificationItemDAO[] = [];
  const read: notificationItemDAO[] = [];
  for (const item of items) {
    if (item.is_read) {
      read.push(item);
    } else {
      unread.push(item);
    }
  }
  return { unread, read };
}

async function fetchAllNotifications(): Promise<notificationItemDAO[]> {
  const collected: notificationItemDAO[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const response = await accountService.getNotification({ page });
    if (response.error) {
      throw new Error(response.error.message ?? 'Failed to load notifications');
    }

    const batch = response.data?.data ?? [];
    collected.push(...batch);

    const next = response.data?.pagination?.next;
    if (next && next > page) {
      page = next;
    } else {
      hasNext = false;
    }
  }

  return collected;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchAllNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await accountService.markNotificationAsRead(id);
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to mark as read');
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<notificationItemDAO[]>(
        NOTIFICATIONS_QUERY_KEY,
      );
      const previousCount = queryClient.getQueryData<{ count: number }>(
        NOTIFICATIONS_COUNT_QUERY_KEY,
      );

      if (previous) {
        const target = previous.find((item) => item.id === id);
        const wasUnread = target && !target.is_read;
        queryClient.setQueryData<notificationItemDAO[]>(
          NOTIFICATIONS_QUERY_KEY,
          previous.map((item) =>
            item.id === id ? { ...item, is_read: true } : item,
          ),
        );
        if (wasUnread && previousCount) {
          queryClient.setQueryData(NOTIFICATIONS_COUNT_QUERY_KEY, {
            count: Math.max(0, previousCount.count - 1),
          });
        }
      }

      return { previous, previousCount };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
      if (context?.previousCount) {
        queryClient.setQueryData(
          NOTIFICATIONS_COUNT_QUERY_KEY,
          context.previousCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_QUERY_KEY });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await accountService.markAllNotificationsAsRead();
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to mark as read');
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<notificationItemDAO[]>(
        NOTIFICATIONS_QUERY_KEY,
      );
      if (previous) {
        queryClient.setQueryData<notificationItemDAO[]>(
          NOTIFICATIONS_QUERY_KEY,
          previous.map((item) => ({ ...item, is_read: true })),
        );
      }
      queryClient.setQueryData(NOTIFICATIONS_COUNT_QUERY_KEY, { count: 0 });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_QUERY_KEY });
    },
  });

  return {
    notifications: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
