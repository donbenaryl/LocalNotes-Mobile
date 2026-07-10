import { useMutation, useQuery } from '@tanstack/react-query';
import smartPickService from '@/http/smart-pick-api/smart-pick.services';
import type { WebResult } from '@/http/smart-pick-api/types';

async function fetchWebResults(sessionId: string): Promise<WebResult[]> {
  const response = await smartPickService.getWebSuggestions(sessionId);
  if (response.error) throw new Error(response.error.message);
  return response.data?.data ?? [];
}

/**
 * Supplemental "around the web" (OpenStreetMap) results for a session.
 * Two-step, mirroring the web app: POST kicks off a server-side search,
 * then GET is enabled once that POST has settled to read the results.
 */
export function useSmartPickWebResults(sessionId: string | null) {
  const triggerMutation = useMutation({
    mutationFn: (id: string) => smartPickService.fetchWebSuggestions(id),
  });

  const hasTriggered = triggerMutation.isSuccess || triggerMutation.isError;

  const resultsQuery = useQuery({
    queryKey: ['smart-pick-web', sessionId],
    queryFn: () => fetchWebResults(sessionId as string),
    enabled: Boolean(sessionId) && hasTriggered,
  });

  return {
    /** Call once, right after a successful create, only if geolocation is available. */
    trigger: () => {
      if (sessionId) triggerMutation.mutate(sessionId);
    },
    webResults: resultsQuery.data ?? [],
    isLoading: triggerMutation.isPending || (hasTriggered && resultsQuery.isPending),
  };
}
