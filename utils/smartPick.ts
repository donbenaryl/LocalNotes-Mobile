import { Linking, Platform } from 'react-native';
import { STRETCH_ENGINE_VALUE, type SmartPickEngineValue } from '@/constants/smartPick';
import type { ConversationResult, DetailedConversation } from '@/http/smart-pick-api/types';

/** Ported from the web app's AIRecommendationResult.tsx match-percent tiers. */
export function getMatchLabel(percent: number | null | undefined): string {
  if (percent == null) return 'Possible match';
  if (percent >= 90) return 'Strong match';
  if (percent >= 75) return 'Good match';
  if (percent >= 60) return 'Decent match';
  return 'Possible match';
}

/** Only "Something different" gets the connector-purple, lower-score, "stretch" treatment. */
export function isStretchEngine(personality: string | null | undefined): boolean {
  return personality === STRETCH_ENGINE_VALUE;
}

/** Opens the device's native maps app centered on a pick's coordinates. */
export function openInMaps(latitude: number, longitude: number, label: string): void {
  const query = encodeURIComponent(label);
  const url = Platform.select({
    ios: `maps:0,0?q=${query}@${latitude},${longitude}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${query})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  void Linking.openURL(url as string);
}

/**
 * A saved conversation only carries its `messages` transcript (engine choice
 * isn't stored as its own field), so we detect the "stretch" engine the same
 * way the summary chips are built — by checking the message text.
 */
export function isStretchConversation(conversation: DetailedConversation): boolean {
  return conversation.messages.some((message) =>
    message.message.toLowerCase().includes('something different'),
  );
}

/**
 * The same business can come back multiple times under different rankings
 * (ported from the web app's dedupeResultsByBestRank) — keep only each
 * business's best (lowest) ranking entry, in ranking order.
 */
export function dedupeSmartPickResults(results: ConversationResult[]): ConversationResult[] {
  const bestByKey = new Map<string, ConversationResult>();

  for (const result of results) {
    const key =
      result.pick?.business?.id ??
      result.pick?.unverified_business?.id ??
      result.pick?.unverified_business?.name ??
      result.id;

    const existing = bestByKey.get(key);
    if (!existing || result.ranking < existing.ranking) {
      bestByKey.set(key, result);
    }
  }

  return Array.from(bestByKey.values()).sort((a, b) => a.ranking - b.ranking);
}

export type { SmartPickEngineValue };
