import type { CSSProperties } from 'react';
import type { SetId } from '@/game/card-sets';
import { SetLogo } from './set-logo';

const PACK_THEMES: Record<SetId, { background: string; crimp: string }> = {
  swsh3: {
    background:
      'radial-gradient(circle at 50% 78%, #ffb347 0%, #d9381e 32%, #4a1020 62%, #160b14 100%)',
    crimp: '#4a1020',
  },
  '30th': {
    background:
      'radial-gradient(circle at 50% 78%, #6d7cff 0%, #3a2f9e 32%, #1f1a5e 62%, #0d0b2e 100%)',
    crimp: '#1f1a5e',
  },
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
