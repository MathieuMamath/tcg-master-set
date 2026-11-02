import type { CSSProperties } from 'react';
import type { SetId } from '@/game/card-sets';
import { SET_COLORS } from '@/game/set-colors';
import { SetLogo } from './set-logo';

function theme(glow: string, middle: string, dark: string, edge: string) {
  return {
    background: `radial-gradient(circle at 50% 78%, ${glow} 0%, ${middle} 32%, ${dark} 62%, ${edge} 100%)`,
    crimp: dark,
  };
}

type PackTheme = { background: string; crimp: string };

const PACK_THEMES: Partial<Record<SetId, PackTheme>> = {
  '30th': theme('#6d7cff', '#3a2f9e', '#1f1a5e', '#0d0b2e'),
  me05: theme('#8d8d9e', '#3f3f50', '#1d1d28', '#08080d'),
  me04: theme('#ff6fb5', '#b0246f', '#561147', '#1f0820'),
  me03: theme('#6fe0a8', '#1f8f68', '#0e4a43', '#062019'),
  'me02.5': theme('#ffd76a', '#b0792a', '#50306f', '#1e1033'),
  me02: theme('#ff9d5c', '#8a3fb0', '#3b1a66', '#150829'),
  me01: theme('#6fd8ff', '#1f7fb0', '#123f6e', '#071a33'),
  'sv10.5w': theme('#fff0d6', '#d98a8a', '#6e3b56', '#27142b'),
  'sv10.5b': theme('#9fd0ff', '#2f6fd0', '#16275f', '#080c26'),
  sv10: theme('#ff7a6b', '#b02a3a', '#3b1a4f', '#120a24'),
  sv09: theme('#ffd66b', '#3fa08a', '#14505a', '#071f26'),
  swsh3: theme('#ffb347', '#d9381e', '#4a1020', '#160b14'),
};

const NEUTRAL_COLOR = '#6b7280';

function darkened(hex: string, keep: number): string {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${channels.map((channel) => Math.round(channel * keep)).join(' ')})`;
}

// Drawn by hand for the sets on sale, and otherwise from the main colour of the set's logo.
function packTheme(setId: SetId): PackTheme {
  const color = SET_COLORS[setId]?.hex ?? NEUTRAL_COLOR;
  return (
    PACK_THEMES[setId] ??
    theme(color, darkened(color, 0.7), darkened(color, 0.4), darkened(color, 0.15))
  );
}

export function packBackground(setId: SetId) {
  return packTheme(setId).background;
}

// For the element around the pack, so that its top edge gets the same colour as the rest.
export function packCrimpStyle(setId: SetId) {
  return { '--pack-crimp': packTheme(setId).crimp } as CSSProperties;
}

// Removes what the cut has already gone past, so that nothing stays behind the edge being torn off.
// It goes below the pack too, to keep the shadow there.
function cutOutline(cut: number) {
  const reached = `${cut * 100}%`;
  return `polygon(0 13%, ${reached} 13%, ${reached} 0, 100% 0, 100% calc(100% + 1rem), 0 calc(100% + 1rem))`;
}

// Everything but the top edge, which the opening animates on its own.
export function PackBody({
  setId,
  setName,
  logoUrl,
  cut = 0,
}: {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
  // How far along the top edge the pack has been cut, from 0 to 1.
  cut?: number;
}) {
  return (
    <span
      style={{
        background: packBackground(setId),
        clipPath: cut > 0 ? cutOutline(cut) : undefined,
      }}
      className="absolute inset-0 overflow-hidden rounded-md border-4 border-ui-ink text-center text-ui-paper shadow-[0_8px_0_var(--ui-ink)]"
    >
      <span className="absolute inset-x-3 top-[13%] bottom-[7%] flex items-center justify-center">
        <SetLogo setName={setName} logoUrl={logoUrl} />
      </span>
      <span className="ui-shine absolute inset-0" />
      <span aria-hidden="true" className="ui-pack-crimp absolute inset-x-0 bottom-0 h-[7%]" />
    </span>
  );
}
