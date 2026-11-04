import type { PlayableSet } from '@/game/card-sets';
import { packPaper } from './pack-art';
import { SetLogo } from './set-logo';

// A binder's cover, as Mamie Noisette sells it: the set's striped paper cut out with a white
// edge, a dark spine with its rivets, and the set's logo. In the player's own binders, a label
// stuck on it also shows how many of its cards they have.
export function BinderCover({ set, owned }: { set: PlayableSet; owned?: number }) {
  return (
    <span
      style={{ background: packPaper(set.id) }}
      className="absolute inset-0 overflow-hidden rounded-md border-[0.3rem] border-ui-paper text-center text-ui-paper shadow-[3px_4px_0_var(--ui-shadow)]"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[15%] bg-ui-ink/60">
        {['top-[18%]', 'top-1/2', 'top-[82%]'].map((top) => (
          <span
            key={top}
            className={`absolute ${top} left-1/2 aspect-square w-[42%] -translate-1/2 rounded-full bg-[#d8d6de] shadow-[inset_-1px_-1px_0_rgb(0_0_0/35%)]`}
          />
        ))}
      </span>
      <span className="absolute inset-y-[14%] right-[6%] left-[21%] flex items-center justify-center text-sm">
        <SetLogo setName={set.name} logoUrl={set.logoUrl} />
      </span>
      {owned !== undefined && (
        <span className="absolute right-0 bottom-[6%] left-[15%] flex justify-center">
          <span className="-rotate-2 ui-scrap px-2 pt-0.5 font-digits text-xs font-bold text-ui-ink">
            {owned} / {set.slotTotal}
          </span>
        </span>
      )}
    </span>
  );
}

// A page of the binder: a sheet of cream card holding three rows of three pockets.
export const PAGE_CLASS =
  'grid grid-cols-3 gap-2 rounded-md bg-ui-paper p-2 shadow-[3px_4px_0_var(--ui-shadow)]';
// A pocket still waiting for its card, pressed into the page.
export const EMPTY_POCKET_CLASS =
  'rounded-[4.5%/3.2%] bg-[#ece2cc] shadow-[inset_1px_2px_0_rgb(44_42_53/14%)]';

const INSIDE_POCKETS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

function InsidePage() {
  return (
    <div aria-hidden="true" className={`${PAGE_CLASS} size-full`}>
      {INSIDE_POCKETS.map((pocket) => (
        <span key={pocket} className={EMPTY_POCKET_CLASS} />
      ))}
    </div>
  );
}

// The binder's name on a strip of paper taped above its pages, with how full it is.
export function BinderTitle({ name, progress }: { name: string; progress: string }) {
  return (
    <div className="-rotate-1 ui-tape ui-scrap px-5 pt-2 pb-1 text-center text-ui-ink">
      <h2 className="font-display text-xl">{name}</h2>
      <p className="text-sm text-ui-ink/75">{progress}</p>
    </div>
  );
}

export const WIDE_PAGE_WIDTH_CLASS = 'w-[min(calc(50%-0.25rem),calc((100dvh-13rem)*0.7))]';

// As long as the opening of a wide binder, in `ui-binder-move` and `ui-binder-turn`.
export const WIDE_OPENING_MILLISECONDS = 1200;
export const NARROW_OPENING_MILLISECONDS = 650;

// The closed binder comes forward and moves to the right, where its spine sits in the middle of
// the screen. Its cover then turns over to the left, and becomes the left page. The layout is the
// same as the real pages, which take over without moving.
function WideOpening({ set, owned }: { set: PlayableSet; owned: number }) {
  return (
    <div className="flex h-full flex-col items-center gap-4">
      {/* Kept out of sight, to hold the room the title takes once the pages are shown. */}
      <div className="invisible">
        <BinderTitle name={set.name} progress="&nbsp;" />
      </div>
      <div className="flex min-h-0 w-full justify-center gap-2">
        <div className={`${WIDE_PAGE_WIDTH_CLASS} aspect-[5/7]`} />
        <div
          className={`ui-binder-move relative ${WIDE_PAGE_WIDTH_CLASS} aspect-[5/7] [perspective-origin:left_center] [perspective:120rem]`}
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
