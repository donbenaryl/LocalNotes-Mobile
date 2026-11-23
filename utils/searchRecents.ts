import AsyncStorage from "@react-native-async-storage/async-storage";

const QUERY_RECENTS_KEY = "search_query_recents";
const VIBE_USAGE_KEY = "search_recent_vibes";

const MAX_QUERY_RECENTS = 3;
const MAX_VIBE_USAGE = 10;

export type RecentVibeEntry = {
  vibe: string;
  count: number;
  lastUsedAt: number;
};

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export async function loadRecentQueries(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(QUERY_RECENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map(normalizeQuery)
      .filter(Boolean)
      .slice(0, MAX_QUERY_RECENTS);
  } catch {
    return [];
  }
}

export async function saveRecentQuery(query: string): Promise<string[]> {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return loadRecentQueries();
  }

  const prev = await loadRecentQueries();
  const updated = [
    normalized,
    ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
  ].slice(0, MAX_QUERY_RECENTS);

  try {
    await AsyncStorage.setItem(QUERY_RECENTS_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
  return updated;
}

export async function removeRecentQuery(query: string): Promise<string[]> {
  const target = normalizeQuery(query).toLowerCase();
  const prev = await loadRecentQueries();
  const updated = prev.filter((item) => item.toLowerCase() !== target);

  try {
    await AsyncStorage.setItem(QUERY_RECENTS_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
  return updated;
}

export async function clearRecentQueries(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUERY_RECENTS_KEY);
  } catch {
    // silently fail
  }
}

async function loadVibeUsageEntries(): Promise<RecentVibeEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(VIBE_USAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is RecentVibeEntry =>
          !!item &&
          typeof item === "object" &&
          typeof (item as RecentVibeEntry).vibe === "string" &&
          typeof (item as RecentVibeEntry).count === "number" &&
          typeof (item as RecentVibeEntry).lastUsedAt === "number",
      )
      .slice(0, MAX_VIBE_USAGE);
  } catch {
    return [];
  }
}

export async function loadRecentVibes(limit = 3): Promise<string[]> {
  const entries = await loadVibeUsageEntries();
  return [...entries]
    .sort((a, b) => b.count - a.count || b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit)
    .map((entry) => entry.vibe);
}

export async function recordVibeUsage(vibes: string[]): Promise<void> {
  const cleaned = vibes.map((v) => v.trim()).filter(Boolean);
  if (cleaned.length === 0) return;

  const now = Date.now();
  const prev = await loadVibeUsageEntries();
  const byKey = new Map(
    prev.map((entry) => [entry.vibe.toLowerCase(), entry] as const),
  );

  for (const vibe of cleaned) {
    const key = vibe.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, {
        vibe: existing.vibe,
        count: existing.count + 1,
        lastUsedAt: now,
      });
    } else {
      byKey.set(key, { vibe, count: 1, lastUsedAt: now });
    }
  }

  const updated = [...byKey.values()]
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, MAX_VIBE_USAGE);

  try {
    await AsyncStorage.setItem(VIBE_USAGE_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}
