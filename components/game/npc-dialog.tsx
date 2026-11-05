'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { moveThroughChoices } from './menu-focus';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, SpeechBox, TypedLine } from './shop-dialog';

// The characters who only have something to say, with nothing to buy or play.
export type Speaker = 'brutus' | 'hulotte';

type Props = {
  speaker: Speaker;
  // Which of the speaker's lines, from the translations.
  line: string;
  // Something the speaker offers to do, such as letting the player in.
  action?: { label: string; onPress: () => void };
  onClose: () => void;
};

export function NpcDialog({ speaker, line, action, onClose }: Props) {
  const t = useTranslations('Speakers');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
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
          {action && (
            <button
              type="submit"
              // biome-ignore lint/a11y/noAutofocus: the offer is the first choice, for the keyboard too.
              autoFocus
              onClick={action.onPress}
              className={`${CHOICE_CLASS} bg-ui-stamp! text-ui-paper`}
            >
              {action.label}
            </button>
          )}
          <button
            type="submit"
            // biome-ignore lint/a11y/noAutofocus: the dialog is closed with the keyboard too.
            autoFocus={!action}
            className={CHOICE_CLASS}
          >
            {t('leave')}
          </button>
        </form>
      </SpeechBox>
    </dialog>
  );
}
