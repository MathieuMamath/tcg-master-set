'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { moveThroughChoices } from './menu-focus';
import { CHOICE_CLASS, ChoiceMarker, TypedLine } from './shop-dialog';

export type QuestLine =
  | 'greeting'
  | 'hurry'
  | 'rewarded'
  | 'failed'
  | 'alreadyDone'
  | 'unavailable';

type Props = {
  line: QuestLine;
  // Null while a quest is running, when there is nothing to accept.
  onAccept: (() => Promise<QuestLine | null>) | null;
  onClose: () => void;
};

// Mounted only while talking. Accepting starts the timer, and closes the conversation unless the
// grandmother answers with something else.
export function QuestDialog({ line: firstLine, onAccept, onClose }: Props) {
  const t = useTranslations('Quest');
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState({ line: firstLine, turn: 0 });
  const [isAsking, setIsAsking] = useState(false);
  const canAccept =
    onAccept !== null && speech.line !== 'rewarded' && speech.line !== 'alreadyDone';

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="quest-speaker"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in mx-auto mt-auto mb-4 w-[calc(100%-2rem)] max-w-2xl overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-transparent"
    >
      <h2
        id="quest-speaker"
        className="relative z-10 ml-5 w-fit -rotate-1 rounded-lg border-4 border-ui-ink bg-ui-accent px-4 py-0.5 text-lg font-semibold"
      >
        {t('name')}
      </h2>
      <div className="-mt-3 rounded-2xl border-4 border-ui-ink bg-ui-paper px-5 pt-6 pb-3 shadow-[0_6px_0_var(--ui-ink)]">
        <TypedLine key={speech.turn} text={t(`lines.${speech.line}`)} />
        <form method="dialog" className="mt-2 border-ui-ink/20 border-t-2 pt-2">
          {canAccept && (
            <button
              type="button"
              // Not `disabled`, which would take the focus away from the keyboard.
              aria-disabled={isAsking}
              className={CHOICE_CLASS}
              onClick={async () => {
                if (isAsking) {
                  return;
                }
                setIsAsking(true);
                const answer = await onAccept();
                setIsAsking(false);
                if (answer) {
                  setSpeech(({ turn }) => ({ line: answer, turn: turn + 1 }));
                } else {
                  dialog.current?.close();
                }
              }}
            >
              <ChoiceMarker />
              {t(speech.line === 'failed' ? 'retry' : 'accept')}
            </button>
          )}
          <button type="submit" className={CHOICE_CLASS}>
            <ChoiceMarker />
            {t('leave')}
          </button>
        </form>
      </div>
    </dialog>
  );
}
