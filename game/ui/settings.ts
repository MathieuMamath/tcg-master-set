// A player's own preferences, saved on the server so that they hold on every device and visit.
export type PlayerSettings = {
  // Whether a cut pack climbs through light effects up to its best card before showing it. Some
  // players find that it gives the cards away, and turn it off.
  pullEffects: boolean;
};

export const DEFAULT_SETTINGS: PlayerSettings = { pullEffects: true };

// A change sent from the settings menu, checked for its shape: only the settings it names change.
export function parseSettingsChange(value: unknown): Partial<PlayerSettings> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const { pullEffects } = value as Record<string, unknown>;
  if (typeof pullEffects !== 'boolean') {
    return null;
  }
  return { pullEffects };
}
