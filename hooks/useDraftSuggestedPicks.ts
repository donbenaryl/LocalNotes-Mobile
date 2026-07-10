import { useUserCoordinates } from "@/hooks/useUserCoordinates";
import { useProfilePicks } from "@/hooks/useProfileList";

export function useDraftSuggestedPicks() {
  const { coordinates, isLoading: coordinatesLoading } = useUserCoordinates();

  const { picks, isPending } = useProfilePicks(
    "All",
    coordinates != null,
    undefined,
    [],
    coordinates ?? undefined,
    true,
  );

  const shouldShow =
    !coordinatesLoading && coordinates != null && !isPending && picks.length > 0;

  return { picks, shouldShow };
}
