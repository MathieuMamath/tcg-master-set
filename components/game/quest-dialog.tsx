'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { QuestGiver } from '@/game/world';
import { focusFirstChoice, moveThroughChoices, openDialog } from './menu-focus';
import { usePlayerName } from './player-name';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, SpeechBox, TypedLine } from './shop-dialog';

export type QuestLine =
  | 'greeting'
  | 'hurry'
  | 'rewarded'
  | 'rewardedShiny'
  | 'failed'
  // A draw that won nothing, which can't be tried again until tomorrow.
  | 'lost'
  | 'alreadyDone'
  | 'unavailable';

type Props = {
  giver: QuestGiver;
  line: QuestLine;
  // Null while a quest is running, when there is nothing to accept.
  onAccept: (() => Promise<QuestLine | null>) | null;
  // Another thing the quest giver offers, such as Papy Caillou's skipping stones.
  extra?: { label: string; onPress: () => void };
  onClose: () => void;
};

// Mounted only while talking. Accepting starts the quest, and closes the conversation unless the
// quest giver answers with something else.
export function QuestDialog({ giver, line: firstLine, onAccept, extra, onClose }: Props) {
  const t = useTranslations('Quest');
  const playerName = usePlayerName();
  const dialog = useRef<HTMLDialogElement>(null);
  const [speech, setSpeech] = useState({ line: firstLine, turn: 0 });
  const [isAsking, setIsAsking] = useState(false);
  const canAccept =
    onAccept !== null &&
    speech.line !== 'rewarded' &&
    speech.line !== 'rewardedShiny' &&
    speech.line !== 'lost' &&
    speech.line !== 'alreadyDone';

  useEffect(() => {
    openDialog(dialog.current);
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
        title={t(`${giver}.title`)}
        portrait={<SellerPortrait stock={giver} />}
      >
        <TypedLine
          key={speech.turn}
          text={
            // Each quest giver only ever gets the lines it has, which this type can't tell.
            t(`${giver}.lines.${speech.line}` as 'grandma.lines.greeting', { name: playerName })
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
                  // The answer may take the accept button away, and the focus with it.
                  requestAnimationFrame(() => dialog.current && focusFirstChoice(dialog.current));
                } else {
                  dialog.current?.close();
                }
              }}
            >
              {speech.line === 'failed' ? t('retry') : t(`${giver}.accept`)}
            </button>
          )}
          {extra && (
            <button
              type="button"
              onClick={extra.onPress}
              className={`${CHOICE_CLASS} bg-ui-stamp text-ui-paper`}
            >
              {extra.label}
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
