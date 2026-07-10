import type { SmartPickEngineValue } from '@/constants/smartPick';
import type { searchUserDAO } from '@/http/account-api/types';

export type SmartPickMode = 'Personality' | 'Vibe';

/** Local UI state for the in-progress form — never persisted, lives in SmartPickTab. */
export interface SmartPickFormState {
  occasion: string | null;
  timeOfDay: string | null;
  mode: SmartPickMode;
  engine: SmartPickEngineValue | null;
  vibe: string | null;
  linkedUsers: searchUserDAO[];
}

export const EMPTY_SMART_PICK_FORM: SmartPickFormState = {
  occasion: null,
  timeOfDay: null,
  mode: 'Personality',
  engine: null,
  vibe: null,
  linkedUsers: [],
};
