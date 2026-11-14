import type { CSSProperties } from 'react';
import type { SetId } from '@/game/cards/card-sets';
import { SET_COLORS } from '@/game/cards/set-colors';
import { SetLogo } from './set-logo';

function theme(glow: string, middle: string) {
  return { glow, middle };
}

type PackTheme = { glow: string; middle: string };

const PACK_THEMES: Partial<Record<SetId, PackTheme>> = {
  '30th': theme('#6d7cff', '#3a2f9e'),
  me05: theme('#8d8d9e', '#3f3f50'),
  me04: theme('#ff6fb5', '#b0246f'),
  me03: theme('#6fe0a8', '#1f8f68'),
  'me02.5': theme('#ffd76a', '#b0792a'),
  me02: theme('#ff9d5c', '#8a3fb0'),
  me01: theme('#6fd8ff', '#1f7fb0'),
  'sv10.5w': theme('#fff0d6', '#d98a8a'),
  'sv10.5b': theme('#9fd0ff', '#2f6fd0'),
  sv10: theme('#ff7a6b', '#b02a3a'),
  sv09: theme('#ffd66b', '#3fa08a'),
  swsh3: theme('#ffb347', '#d9381e'),
};

const NEUTRAL_COLOR = '#6b7280';

function darkened(hex: string, keep: number): string {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${channels.map((channel) => Math.round(channel * keep)).join(' ')})`;
}

// Drawn by hand for the sets on sale, and otherwise from the main colour of the set's logo.
function packTheme(setId: SetId): PackTheme {
  const color = SET_COLORS[setId]?.hex ?? NEUTRAL_COLOR;
  return PACK_THEMES[setId] ?? theme(color, darkened(color, 0.7));
}

// The pack's printed paper, like the prototype's: a diagonal gradient in the set's colours, crossed
// by pale stripes.
export function packPaper(setId: SetId) {
  const { glow, middle } = packTheme(setId);
  return [
    'repeating-linear-gradient(135deg, rgb(255 255 255 / 16%) 0 4.8%, transparent 4.8% 11%)',
    `linear-gradient(135deg, ${middle}, color-mix(in oklab, ${glow} 45%, ${middle}), ${middle})`,
  ].join(', ');
}

// For the element around the pack, so that its top edge, drawn apart, gets the same paper.
export function packEdgeStyle(setId: SetId) {
  return { '--pack-paper': packPaper(setId) } as CSSProperties;
}

const TEETH = 20;

// A crimped edge of sharp teeth, as a list of points from left to right.
function teeth(edge: (isTip: boolean) => string) {
  return Array.from(
    { length: TEETH + 1 },
    (_, index) => `${(index * 100) / TEETH}% ${edge(index % 2 === 1)}`,
  );
}

// The teeth go this deep into the pack, as a share of its height.
const TEETH_DEPTH = 2.7;
// The top edge, which the player cuts off, takes this share of the pack's height.
export const EDGE_HEIGHT = 13;

const PACK_OUTLINE = `polygon(${[
  ...teeth((isTip) => (isTip ? '0%' : `${TEETH_DEPTH}%`)),
  ...teeth((isTip) => (isTip ? '100%' : `${100 - TEETH_DEPTH}%`)).reverse(),
].join(', ')})`;

const EDGE_OUTLINE = `polygon(${[
  ...teeth((isTip) => (isTip ? '0%' : `${(TEETH_DEPTH * 100) / EDGE_HEIGHT}%`)),
  '100% 100%',
  '0% 100%',
].join(', ')})`;

// Removes what the cut has already gone past, so that nothing stays behind the edge being torn off.
function cutOutline(cut: number) {
  const reached = `${cut * 100}%`;
  return `polygon(0 ${EDGE_HEIGHT}%, ${reached} ${EDGE_HEIGHT}%, ${reached} 0, 100% 0, 100% 100%, 0 100%)`;
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
    // A paper-cut shadow as for everything else, and a soft one under it for the pack's thickness.
    <span className="absolute inset-0 [filter:drop-shadow(4px_6px_0_var(--ui-shadow))_drop-shadow(0_10px_14px_rgb(0_0_0/30%))]">
      <span
        style={{ clipPath: cut > 0 ? cutOutline(cut) : undefined }}
        className="absolute inset-0"
      >
        <span
          style={{ background: packPaper(setId), clipPath: PACK_OUTLINE }}
          className="absolute inset-0 text-center text-ui-paper"
        >
          <span className="ui-pack-band absolute inset-x-0 top-0 h-[13%]" />
          <span className="absolute inset-x-[7%] top-[13%] bottom-[7%] flex items-center justify-center">
            <SetLogo setName={setName} logoUrl={logoUrl} />
          </span>
          <span className="ui-pack-band absolute inset-x-0 bottom-0 h-[7%]" />
          <span className="ui-pack-volume pointer-events-none absolute inset-0" />
          <span className="ui-pack-gloss pointer-events-none absolute inset-0" />
          <span className="ui-paper-grain absolute inset-0" />
        </span>
      </span>
    </span>
  );
}

// The crimped top edge, which the player cuts off. The element around it must have the pack's
// `packEdgeStyle`.
export function PackEdge({ style, className = '' }: { style?: CSSProperties; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={`absolute inset-x-0 top-0 h-[13%] drop-shadow-[4px_3px_0_var(--ui-shadow)] ${className}`}
    >
      <span style={{ clipPath: EDGE_OUTLINE }} className="absolute inset-0 overflow-hidden">
        {/* The whole pack's paper, of which only the top shows. */}
        <span
          style={{ height: `${10000 / EDGE_HEIGHT}%`, background: 'var(--pack-paper)' }}
          className="absolute inset-x-0 top-0"
        />
        <span className="ui-pack-band absolute inset-0" />
        {/* The same curve as the body below, so that the edge meets it seamlessly. */}
        <span
          style={{ height: `${10000 / EDGE_HEIGHT}%` }}
          className="ui-pack-volume pointer-events-none absolute inset-x-0 top-0"
        />
        <span className="ui-paper-grain absolute inset-0" />
      </span>
    </span>
  );
}
