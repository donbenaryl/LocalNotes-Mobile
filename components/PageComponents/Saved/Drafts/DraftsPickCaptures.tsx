import { useMemo } from "react";
import { View } from "react-native";
import { PickCard } from "@/components/PageComponents/Profile/PickCard";
import { useProfilePicks } from "@/hooks/useProfileList";

function todayDateFrom(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DraftsPickCaptures() {
  const dateFrom = useMemo(() => todayDateFrom(), []);
  const { picks, isPending, refetch } = useProfilePicks(
    "All",
    true,
    undefined,
    [],
    undefined,
    undefined,
    dateFrom,
  );

  const sortedPicks = useMemo(
    () =>
      [...picks].sort((a, b) => {
        const aHas = (a.images?.length ?? 0) > 0;
        const bHas = (b.images?.length ?? 0) > 0;
        if (aHas === bHas) return 0;
        return aHas ? -1 : 1;
      }),
    [picks],
  );

  const { leftColumn, rightColumn } = useMemo(() => {
    const left = sortedPicks.filter((_, index) => index % 2 === 0);
    const right = sortedPicks.filter((_, index) => index % 2 === 1);
    return { leftColumn: left, rightColumn: right };
  }, [sortedPicks]);

  if (isPending || picks.length === 0) return null;

  return (
    <View className="mb-4 flex-row gap-3">
      <View className="flex-1 gap-3">
        {leftColumn.map((pick) => (
          <PickCard
            key={pick.id}
            data={pick}
            onRefresh={() => void refetch()}
          />
        ))}
      </View>
      <View className="flex-1 gap-3">
        {rightColumn.map((pick) => (
          <PickCard
            key={pick.id}
            data={pick}
            onRefresh={() => void refetch()}
          />
        ))}
      </View>
    </View>
  );
}
