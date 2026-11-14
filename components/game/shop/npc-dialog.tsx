'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { moveThroughChoices, openDialog } from '../menu-focus';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, SpeechBox, TypedLine } from './shop-dialog';

// The characters who only have something to say, with nothing to buy or play.
export type Speaker =
  | 'brutus'
  | 'hulotte'
  | 'archivist'
  | 'trotte'
  | 'painter'
  | 'ronron'
  | 'kitten'
  | 'boutiqueSeller';

type Props = {
  speaker: Speaker;
  // Which of the speaker's lines, from the translations.
  line: string;
  // What the speaker offers to do, such as letting the player in, one choice each.
  action?: { label: string; onPress: () => void };
  actions?: readonly { label: string; onPress: () => void }[];
  onClose: () => void;
};

export function NpcDialog({ speaker, line, action, actions = [], onClose }: Props) {
  const choices = action ? [action, ...actions] : actions;
  const t = useTranslations('Speakers');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="npc-speaker"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in mx-auto mt-auto mb-4 w-[min(41.25rem,calc(100%-2rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-transparent"
    >
      <SpeechBox
        nameId="npc-speaker"
        name={t(`${speaker}.name`)}
        title={t(`${speaker}.title`)}
        portrait={<SellerPortrait stock={speaker} />}
      >
        <TypedLine
          // Each speaker only ever gets the lines it has, which this type can't tell.
          text={t(`${speaker}.lines.${line}` as 'brutus.lines.refused')}
        />
        <form method="dialog" className="mt-2.5 flex flex-wrap gap-2.5">
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="submit"
              onClick={choice.onPress}
              className={`${CHOICE_CLASS} bg-ui-stamp! text-ui-paper`}
            >
              {choice.label}
            </button>
          ))}
          <button type="submit" className={CHOICE_CLASS}>
            {t('leave')}
          </button>
        </form>
      </SpeechBox>
    </dialog>
  );
}
