'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { DOJO_JOBS, RAMEN_JOBS, type ShiftJob } from '@/game/shifts';
import type { Wallet } from '@/game/shop-dialogue';
import { ArcheryShift } from './dojo-archery-scene';
import { SlicingShift } from './dojo-slicing-scene';
import { focusFirstChoice, moveThroughChoices, openDialog } from './menu-focus';
import { usePlayerName } from './player-name';
import { DishesShift } from './ramen-dishes-scene';
import { KitchenShift } from './ramen-kitchen-scene';
import { ServiceShift } from './ramen-service-scene';
import { SellerPortrait } from './seller-portrait';
import type { ShiftEnd, ShiftHost } from './shift';
import { CHOICE_CLASS, SpeechBox, TypedLine } from './shop-dialog';

type HostLine =
  | 'greeting'
  | 'rewarded'
  | 'rewardedAll'
  | 'alreadyPaid'
  | 'allEarned'
  | 'failed'
  | 'unavailable';

type View =
  | { kind: 'talk'; line: HostLine; coins: number; turn: number }
  | { kind: 'shift'; job: ShiftJob };

// Each host's texts and the shifts they offer.
const HOSTS = {
  ramenChef: { namespace: 'Ramen', jobs: RAMEN_JOBS },
  dojoMaster: { namespace: 'Dojo', jobs: DOJO_JOBS },
} as const satisfies Record<ShiftHost, { namespace: string; jobs: readonly ShiftJob[] }>;

// Each shift's game.
const SHIFTS: Record<ShiftJob, (props: { onDone: (end: ShiftEnd) => void }) => ReactNode> = {
  dishes: DishesShift,
  kitchen: KitchenShift,
  service: ServiceShift,
  slicing: SlicingShift,
  archery: ArcheryShift,
};

type Props = {
  host: ShiftHost;
  // The coins after a shift, and whether it paid, for the counters and the save notice.
  onShiftEnd: (wallet: Wallet, hasPaid: boolean) => void;
  onClose: () => void;
};

// A host of shifts: Yuzu at Ramen Yuzu, who offers her three jobs, or Maître Kaito at the dojo, who
// offers his two lessons. The shift itself plays here, and the host answers with what it paid. The
// server plays every shift again and pays, once a day per job.
export function ShiftDialog({ host, onShiftEnd, onClose }: Props) {
  const { namespace, jobs } = HOSTS[host];
  const t = useTranslations(namespace);
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

  const backToHost = (line: HostLine, coins = 0) =>
    setView((current) => ({
      kind: 'talk',
      line,
      coins,
      turn: current.kind === 'talk' ? current.turn + 1 : 1,
    }));

  const endShift = (result: ShiftEnd) => {
    if (result === 'gaveUp') {
      backToHost('greeting');
      return;
    }
    if (!result) {
      backToHost('unavailable');
      return;
    }
    onShiftEnd(result.wallet, result.coins > 0);
    const line: HostLine =
      result.coins > 0
        ? result.hasEarnedAll
          ? 'rewardedAll'
          : 'rewarded'
        : result.hasEarnedAll
          ? 'allEarned'
          : result.wasAlreadyPaid
            ? 'alreadyPaid'
            : 'failed';
    backToHost(line, result.coins);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={isShift ? 'shift-title' : 'shift-host'}
      onClose={onClose}
      onCancel={(event) => {
        // Escape stops a shift and goes back to its host, rather than leaving the place.
        if (isShift) {
          event.preventDefault();
          backToHost('greeting');
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
        (() => {
          const Shift = SHIFTS[view.job];
          return <Shift onDone={endShift} />;
        })()
      ) : (
        <SpeechBox
          nameId="shift-host"
          name={t('name')}
          title={t('title')}
          portrait={<SellerPortrait stock={host} />}
        >
          <TypedLine
            key={view.turn}
            text={t(`lines.${view.line}`, { name: playerName, coins: view.coins })}
          />
          <form method="dialog" className="mt-2.5 flex flex-wrap gap-2.5">
            {jobs.map((job) => (
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
