'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { RAMEN_JOBS, type RamenJob } from '@/game/ramen';
import type { Wallet } from '@/game/shop-dialogue';
import type { RamenShiftResult } from '@/player/progress';
import { focusFirstChoice, moveThroughChoices, openDialog } from './menu-focus';
import { usePlayerName } from './player-name';
import { DishesShift } from './ramen-dishes-scene';
import { KitchenShift } from './ramen-kitchen-scene';
import { ServiceShift } from './ramen-service-scene';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, SpeechBox, TypedLine } from './shop-dialog';

type ChefLine = 'greeting' | 'rewarded' | 'alreadyPaid' | 'failed' | 'unavailable';

type View =
  | { kind: 'talk'; line: ChefLine; coins: number; turn: number }
  | { kind: 'shift'; job: RamenJob };

type Props = {
  // The coins after a shift, and whether it paid, for the counters and the save notice.
  onShiftEnd: (wallet: Wallet, hasPaid: boolean) => void;
  onClose: () => void;
};

// Yuzu, at Ramen Yuzu: she offers her three jobs, then the shift itself plays here, and she
// answers with what it paid. The server plays every shift again and pays, once a day per job.
export function RamenDialog({ onShiftEnd, onClose }: Props) {
  const t = useTranslations('Ramen');
  const playerName = usePlayerName();
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>({ kind: 'talk', line: 'greeting', coins: 0, turn: 0 });
  const isShift = view.kind === 'shift';

  useEffect(() => {
    openDialog(dialog.current);
  }, []);

  // Each new view puts the focus on its first choice, once it is drawn.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these are what change the view.
  useEffect(() => {
    const frame = requestAnimationFrame(() => dialog.current && focusFirstChoice(dialog.current));
    return () => cancelAnimationFrame(frame);
  }, [view.kind, view.kind === 'talk' ? view.turn : view.job]);

  const backToYuzu = (line: ChefLine, coins = 0) =>
    setView((current) => ({
      kind: 'talk',
      line,
      coins,
      turn: current.kind === 'talk' ? current.turn + 1 : 1,
    }));

  const endShift = (result: RamenShiftResult | null | 'gaveUp') => {
    if (result === 'gaveUp') {
      backToYuzu('greeting');
      return;
    }
    if (!result) {
      backToYuzu('unavailable');
      return;
    }
    onShiftEnd(result.wallet, result.coins > 0);
    backToYuzu(
      result.coins > 0 ? 'rewarded' : result.wasAlreadyPaid ? 'alreadyPaid' : 'failed',
      result.coins,
    );
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={isShift ? 'ramen-shift-title' : 'ramen-chef'}
      onClose={onClose}
      onCancel={(event) => {
        // Escape stops a shift and goes back to Yuzu, rather than leaving the shop.
        if (isShift) {
          event.preventDefault();
          backToYuzu('greeting');
        }
      }}
      onKeyDown={isShift ? undefined : moveThroughChoices}
      className={`ui-pop-in max-w-none overflow-visible bg-transparent font-game text-ui-ink ${
        isShift
          ? 'm-auto w-[min(34rem,calc(100%-1rem))] backdrop:bg-ui-ink/50'
          : 'mx-auto mt-auto mb-4 w-[min(41.25rem,calc(100%-2rem))] backdrop:bg-transparent'
      }`}
    >
      {view.kind === 'shift' ? (
        view.job === 'service' ? (
          <ServiceShift onDone={endShift} />
        ) : view.job === 'kitchen' ? (
          <KitchenShift onDone={endShift} />
        ) : (
          <DishesShift onDone={endShift} />
        )
      ) : (
        <SpeechBox
          nameId="ramen-chef"
          name={t('name')}
          title={t('title')}
          portrait={<SellerPortrait stock="ramenChef" />}
        >
          <TypedLine
            key={view.turn}
            text={t(`lines.${view.line}`, { name: playerName, coins: view.coins })}
          />
          <form method="dialog" className="mt-2.5 flex flex-wrap gap-2.5">
            {RAMEN_JOBS.map((job) => (
              <button
                key={job}
                type="button"
                onClick={() => setView({ kind: 'shift', job })}
                className={`${CHOICE_CLASS} bg-ui-stamp! text-ui-paper`}
              >
                {t(`jobs.${job}`)}
              </button>
            ))}
            <button type="submit" className={CHOICE_CLASS}>
              {t('leave')}
            </button>
          </form>
        </SpeechBox>
      )}
    </dialog>
  );
}
