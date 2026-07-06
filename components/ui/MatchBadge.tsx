import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getMatchPercentFromSimilarity,
  useSimilarScores,
} from "@/hooks/useSimilarScores";
import { getPersonalityMatchPillStyle } from "@/utils/personalityRing";

interface MatchBadgeProps {
  userId: string;
  personalityColor?: Record<string, number> | null;
  enabled?: boolean;
}

export function MatchBadge({
  userId,
  personalityColor,
  enabled = true,
}: MatchBadgeProps) {
  const { t } = useTranslation();
  const { similarScores } = useSimilarScores(userId, enabled);
  const matchPercent = getMatchPercentFromSimilarity(similarScores);
  const matchPillStyle = getPersonalityMatchPillStyle(personalityColor);

  if (!enabled || matchPercent == null) {
    return null;
  }

  return (
    <View
      className="rounded-md px-2.5 py-1"
      style={{ backgroundColor: matchPillStyle.backgroundColor }}
    >
      <Text
        className="font-geist-bold text-sm"
        style={{ color: matchPillStyle.color }}
      >
        {t("home.forYou.match", { percent: matchPercent })}
      </Text>
    </View>
  );
}
