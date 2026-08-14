/**
 * Maps personality-colors API `color_name` to a short archetype label.
 * Sourced from web dashboard personalityCopy (adjective without leading "The ").
 */
const COLOR_NAME_TO_LABEL: Record<string, string> = {
  Red: 'Tastemaker',
  Blue: 'Relaxed Local',
  Teal: 'Explorer',
  Green: 'Social Connector',
  Orange: 'Social Explorer',
  Yellow: 'Social Connector',
  Purple: 'Adventurer',
  Gray: 'Adventurer',
};

export function getBusinessPersonalityLabel(colorName: string): string {
  return COLOR_NAME_TO_LABEL[colorName] ?? 'Balanced';
}
