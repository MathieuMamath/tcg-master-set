'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { QuestGiver } from '@/game/world';
import { moveThroughChoices } from './menu-focus';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, SpeechBox, TypedLine } from './shop-dialog';

export type QuestLine =
  | 'greeting'
  | 'hurry'
  | 'rewarded'
  | 'rewardedShiny'
  | 'failed'
  | 'alreadyDone'
  | 'unavailable';

type Props = {
  giver: QuestGiver;
  line: QuestLine;
  // Null while a quest is running, when there is nothing to accept.
  onAccept: (() => Promise<QuestLine | null>) | null;
  onClose: () => void;
};

// Mounted only while talking. Accepting starts the quest, and closes the conversation unless the
// quest giver answers with something else.
export function QuestDialog({ giver, line: firstLine, onAccept, onClose }: Props) {
  const t = useTranslations('Quest');
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState({ line: firstLine, turn: 0 });
  const [isAsking, setIsAsking] = useState(false);
  const canAccept =
    onAccept !== null &&
    speech.line !== 'rewarded' &&
    speech.line !== 'rewardedShiny' &&
    speech.line !== 'alreadyDone';

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="quest-speaker"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in mx-auto mt-auto mb-4 w-[min(41.25rem,calc(100%-2rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-transparent"
    >
      <SpeechBox
        nameId="quest-speaker"
        name={t(`${giver}.name`)}
        // Only Léa is drawn in paper yet, so only she has a title and a portrait.
        title={giver === 'grandma' ? t('grandma.title') : undefined}
        portrait={giver === 'grandma' ? <SellerPortrait stock="grandma" /> : undefined}
      >
        <TypedLine
          key={speech.turn}
          text={
            // Each quest giver only ever gets the lines it has, which this type can't tell.
            t(`${giver}.lines.${speech.line}` as 'grandma.lines.greeting')
          }
        />
        <form method="dialog" className="mt-2.5 flex flex-wrap gap-2.5">
          {canAccept && (
            <button
              type="button"
              // Not `disabled`, which would take the focus away from the keyboard.
              aria-disabled={isAsking}
              className={`${CHOICE_CLASS} bg-ui-stamp text-ui-paper`}
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
              {speech.line === 'failed' ? t('retry') : t(`${giver}.accept`)}
            </button>
          )}
          <button type="submit" className={CHOICE_CLASS}>
            {t('leave')}
          </button>
        </form>
      </SpeechBox>
    </dialog>
  );
}
