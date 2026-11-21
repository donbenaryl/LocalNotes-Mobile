import AsyncStorage from '@react-native-async-storage/async-storage';

// Non-secret preference: how many times the user skipped the quiz while their profile was empty.
const KEY = 'personality_quiz_skip_count';

export async function getPersonalitySkipCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function recordPersonalitySkip(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String((await getPersonalitySkipCount()) + 1));
  } catch {
    // best-effort; worst case the quiz is offered once more
  }
}
