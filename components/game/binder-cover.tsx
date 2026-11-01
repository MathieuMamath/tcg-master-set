import type { PlayableSet } from '@/game/card-sets';
import { packBackground } from './pack-art';
import { SetLogo } from './set-logo';

const RINGS = ['top-[18%]', 'top-[47%]', 'top-[76%]'];

export function BinderCover({ set, owned }: { set: PlayableSet; owned: number }) {
  return (
    <span
      style={{ background: packBackground(set.id) }}
      className="absolute inset-0 overflow-hidden rounded-xl border-4 border-ui-ink text-center text-ui-paper shadow-[0_8px_0_var(--ui-ink)]"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[13%] bg-ui-ink/70">
        {RINGS.map((position) => (
          <span
            key={position}
            className={`absolute left-1/2 h-[6%] w-3/5 -translate-x-1/2 rounded-full border-2 border-ui-paper/80 bg-ui-ink ${position}`}
          />
        ))}
      </span>
      <span className="absolute inset-y-3 right-3 left-[18%] flex items-center justify-center">
        <SetLogo setName={set.name} logoUrl={set.logoUrl} />
      </span>
      <span className="absolute right-0 bottom-[3%] left-[13%] text-sm font-semibold text-ui-paper/75">
        {owned} / {set.slotTotal}
      </span>
    </span>
  );
}

const INSIDE_POCKETS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const INSIDE_PAGE_CLASS =
  'grid size-full grid-cols-3 gap-2 rounded-2xl border-4 border-ui-paper/40 bg-[#3b3157] p-2';

function InsidePage() {
  return (
    <div aria-hidden="true" className={INSIDE_PAGE_CLASS}>
      {INSIDE_POCKETS.map((pocket) => (
        <span key={pocket} className="rounded-md border-2 border-dashed border-ui-paper/30" />
      ))}
    </div>
  );
}

export const WIDE_PAGE_WIDTH_CLASS = 'w-[min(calc(50%-0.25rem),calc((100dvh-11.5rem)*0.7))]';

// As long as the opening of a wide binder, in `ui-binder-move` and `ui-binder-turn`.
export const WIDE_OPENING_MILLISECONDS = 1200;
export const NARROW_OPENING_MILLISECONDS = 650;

// The closed binder comes forward and moves to the right, where its spine sits in the middle of
// the screen. Its cover then turns over to the left, and becomes the left page. The layout is the
// same as the real pages, which take over without moving.
function WideOpening({ set, owned }: { set: PlayableSet; owned: number }) {
  return (
    <div className="flex h-full flex-col items-center gap-3">
      <div className="text-center text-ui-paper">
        <h2 className="text-xl font-semibold">{set.name}</h2>
        <p aria-hidden="true">&nbsp;</p>
      </div>
      <div className="flex min-h-0 w-full justify-center gap-2">
        <div className={`${WIDE_PAGE_WIDTH_CLASS} aspect-[5/6.83]`} />
        <div
          className={`ui-binder-move relative ${WIDE_PAGE_WIDTH_CLASS} aspect-[5/6.83] [perspective-origin:left_center] [perspective:120rem]`}
        >
          <InsidePage />
          <div className="ui-binder-turn absolute inset-0 [transform-origin:-0.25rem_50%] [transform-style:preserve-3d]">
            <div className="absolute inset-0 [backface-visibility:hidden]">
              <BinderCover set={set} owned={owned} />
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <InsidePage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NarrowOpening({ set, owned }: { set: PlayableSet; owned: number }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative aspect-[5/6] w-[min(100%,50vh,24rem)] [perspective:60rem]">
        <InsidePage />
        <div className="ui-binder-open absolute inset-0 origin-left">
          <BinderCover set={set} owned={owned} />
        </div>
      </div>
    </div>
  );
}

export function BinderOpening({
  set,
  owned,
  isWide,
}: {
  set: PlayableSet;
  owned: number;
  isWide: boolean;
}) {
  return isWide ? (
    <WideOpening set={set} owned={owned} />
  ) : (
    <NarrowOpening set={set} owned={owned} />
  );
}
