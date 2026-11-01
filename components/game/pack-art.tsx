import type { CSSProperties } from 'react';
import type { SetId } from '@/game/card-sets';
import { SetLogo } from './set-logo';

function theme(glow: string, middle: string, dark: string, edge: string) {
  return {
    background: `radial-gradient(circle at 50% 78%, ${glow} 0%, ${middle} 32%, ${dark} 62%, ${edge} 100%)`,
    crimp: dark,
  };
}

const PACK_THEMES: Record<SetId, { background: string; crimp: string }> = {
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

export function packBackground(setId: SetId) {
  return PACK_THEMES[setId].background;
}

// For the element around the pack, so that its top edge gets the same colour as the rest.
export function packCrimpStyle(setId: SetId) {
  return { '--pack-crimp': PACK_THEMES[setId].crimp } as CSSProperties;
}

// Everything but the top edge, which the opening animates on its own.
export function PackBody({
  setId,
  setName,
  logoUrl,
}: {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
}) {
  return (
    <span
      style={{ background: packBackground(setId) }}
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
