/**
 * Copy and option values for the Smart Pick form/results.
 * `personality` values below must match the backend contract exactly (see
 * ConversationRequest in http/smart-pick-api/types.ts) — they were verified
 * against the web app's OptionMode.tsx, not invented for mobile.
 */

export const SMART_PICK_OCCASIONS = [
  'Date',
  'Hangout',
  'Adventure',
  'Solo',
  'Tourist',
  'Just curious',
] as const;

export const SMART_PICK_TIMES = ['Morning', 'Afternoon', 'Evening'] as const;

export type SmartPickEngineValue =
  | 'My Personality Match'
  | 'Try Something Opposite'
  | 'Local Vibes';

export interface SmartPickEngineOption {
  value: SmartPickEngineValue;
  emoji: string;
  name: string;
  detail: string;
}

export const SMART_PICK_ENGINES: SmartPickEngineOption[] = [
  {
    value: 'My Personality Match',
    emoji: '🎯',
    name: 'My personality',
    detail: 'Lean into what you already love',
  },
  {
    value: 'Try Something Opposite',
    emoji: '🔀',
    name: 'Something different',
    detail: "Try what you wouldn't normally pick",
  },
  {
    value: 'Local Vibes',
    emoji: '📍',
    name: 'Local vibes',
    detail: 'What locals actually go for',
  },
];

/** The one engine that gets the connector-purple "stretch" treatment on results. */
export const STRETCH_ENGINE_VALUE: SmartPickEngineValue = 'Try Something Opposite';

/** Vibe options for Smart Pick — must match web OptionMode.tsx exactly. */
export const SMART_PICK_VIBES = [
  'Chill',
  'Romantic',
  'Social',
  'Adventurous',
  'Creative',
  'Peaceful',
  'Trendy',
  'Hidden',
  'Wild',
] as const;
