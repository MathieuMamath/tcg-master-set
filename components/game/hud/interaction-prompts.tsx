import { useTranslations } from 'next-intl';
import type { RefObject } from 'react';
import type { Interaction } from '@/game/world/world';
import { isTalk } from '../talk';

type Props = {
  // What the character can do where it stands, if anything.
  interaction: Interaction | null;
  username: string;
  // Papy Caillou's saying, shown instead of his bubble once his memory game is won for the day.
  papySaying: number | null;
  canSleep: boolean;
  searchNote: 'nothing' | 'unavailable' | null;
  // The speech bubble, which the scene moves just above the head of who it belongs to.
  bubble: RefObject<HTMLElement | null>;
  onInteract: () => void;
};

const BUBBLE_TAIL =
  'absolute bottom-0.5 left-1/2 h-4 w-3 -translate-x-1/2 bg-ui-paper [clip-path:polygon(0_0,100%_0,30%_100%)]';

// What can be done where the character stands: talking to someone, in a speech bubble over their
// head, or anything else, in a prompt at the bottom of the screen.
export function InteractionPrompts({
  interaction,
  username,
  papySaying,
  canSleep,
  searchNote,
  bubble,
  onInteract,
}: Props) {
  const t = useTranslations('Game');
  const tHails = useTranslations('Hails');
  const tQuest = useTranslations('Quest');

  if (papySaying !== null) {
    return (
      // Papy Caillou's saying, in his speech bubble, once his memory game is won for the day.
      // Pressing it, or the interact key, still talks to him, for his skipping stones.
      <button
        ref={bubble as RefObject<HTMLButtonElement | null>}
        type="button"
        aria-live="polite"
        onClick={onInteract}
        style={{ transform: 'translate(-200vw, 0)' }}
        className="group absolute top-0 left-0 cursor-pointer pb-2.5 font-game text-ui-ink"
      >
        <span className="ui-pop-in block w-max max-w-[min(22rem,80vw)] rounded-[2rem] bg-ui-paper px-6 py-3 text-center shadow-[3px_4px_0_var(--ui-shadow)]">
          <span className="block text-lg leading-snug">
            « {tQuest(`grandpa.proverbs.${papySaying}.text` as 'grandpa.proverbs.1.text')} »
          </span>
          <span className="mt-1 block text-sm text-ui-ink/60">
            {tQuest(`grandpa.proverbs.${papySaying}.source` as 'grandpa.proverbs.1.source')}
          </span>
          <span className="mt-1.5 flex items-center justify-center gap-2 text-base">
            <kbd className="rounded-full bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
              E
            </kbd>
            {t('grandpa')}
          </span>
        </span>
        <span aria-hidden="true" className={BUBBLE_TAIL} />
      </button>
    );
  }

  if (!interaction) {
    return null;
  }

  if (isTalk(interaction)) {
    return (
      <button
        ref={bubble as RefObject<HTMLButtonElement | null>}
        type="button"
        aria-label={t(interaction)}
        onClick={onInteract}
        style={{ transform: 'translate(-200vw, 0)' }}
        className="group absolute top-0 left-0 cursor-pointer pb-2.5 font-game text-xl text-ui-ink"
      >
        <span className="ui-pop-in flex items-center gap-2 rounded-[50%] bg-ui-paper px-9 py-3 shadow-[3px_4px_0_var(--ui-shadow)] transition-transform group-hover:-translate-y-0.5">
          <kbd className="rounded-full bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
            E
          </kbd>
          {/* What the character says, while the button's name says what pressing it does. */}
          <span aria-hidden="true">{tHails(interaction, { name: username })}</span>
        </span>
        {/* The bubble's tail, pointing down at the speaker. */}
        <span aria-hidden="true" className={BUBBLE_TAIL} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onInteract}
      aria-disabled={interaction === 'bed' && !canSleep}
      className="ui-bob absolute inset-x-0 bottom-16 mx-auto pointer-coarse:bottom-44 min-[48rem]:pointer-fine:bottom-22 flex w-fit cursor-pointer items-center gap-2 ui-paper-button bg-ui-paper py-1 pr-4 pl-1.5 font-game text-xl text-ui-ink"
    >
      <kbd className="ui-scrap bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
        E
      </kbd>
      {interaction === 'bed' && !canSleep
        ? t('notSleepy')
        : interaction === 'search' && searchNote
          ? t(`searched.${searchNote}`)
          : t(interaction)}
    </button>
  );
}
