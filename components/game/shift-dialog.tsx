'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { DOJO_JOBS, GARDEN_JOBS, RAMEN_JOBS, type ShiftJob, STONES_JOBS } from '@/game/shifts';
import type { Wallet } from '@/game/shop-dialogue';
import { ArcheryShift } from './dojo-archery-scene';
import { SlicingShift } from './dojo-slicing-scene';
import { focusFirstChoice, moveThroughChoices, openDialog } from './menu-focus';
import { CleanupShift } from './park-cleanup-scene';
import { StonesShift } from './park-stones-scene';
import { usePlayerName } from './player-name';
import { DishesShift } from './ramen-dishes-scene';
import { KitchenShift } from './ramen-kitchen-scene';
import { ServiceShift } from './ramen-service-scene';
import { SellerPortrait } from './seller-portrait';
import { type ShiftEnd, type ShiftHost, ShiftOpenedDirectly } from './shift';
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
  gardener: { namespace: 'Garden', jobs: GARDEN_JOBS },
  grandpa: { namespace: 'Stones', jobs: STONES_JOBS },
} as const satisfies Record<ShiftHost, { namespace: string; jobs: readonly ShiftJob[] }>;

// Each shift's game.
const SHIFTS: Record<ShiftJob, (props: { onDone: (end: ShiftEnd) => void }) => ReactNode> = {
  dishes: DishesShift,
  kitchen: KitchenShift,
  service: ServiceShift,
  slicing: SlicingShift,
  archery: ArcheryShift,
  cleanup: CleanupShift,
  stones: StonesShift,
};

type Props = {
  host: ShiftHost;
  // A shift to open straight onto, when the conversation that led here already offered it.
  startJob?: ShiftJob;
  // Another thing the host offers, such as Pépin's flower beds to water, and what the host says
  // instead when it is done for the day, which leaves nothing to open.
  extra?: { label: string; onPress: () => void; doneLine: string | null };
  // The coins after a shift, and whether it paid, for the counters and the save notice.
  onShiftEnd: (wallet: Wallet, hasPaid: boolean) => void;
  onClose: () => void;
};

// A host of shifts: Yuzu at Ramen Yuzu, who offers her three jobs, Maître Kaito at the dojo, who
// offers his two lessons, Pépin in the park's garden, with his two chores, or Papy Caillou, with his
// skipping stones. The shift itself plays here, and the host answers with what it paid. The
// server plays every shift again and pays each new star of the day.
export function ShiftDialog({ host, startJob, extra, onShiftEnd, onClose }: Props) {
  const { namespace, jobs } = HOSTS[host];
  const t = useTranslations(namespace);
  const playerName = usePlayerName();
  const dialog = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<View>(
    startJob
      ? { kind: 'shift', job: startJob }
      : { kind: 'talk', line: 'greeting', coins: 0, turn: 0 },
  );
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

  // What the host said about the extra once it is done for the day, in place of their line.
  const [extraSaid, setExtraSaid] = useState<string | null>(null);

  const backToHost = (line: HostLine, coins = 0) => {
    setExtraSaid(null);
    setView((current) => ({
      kind: 'talk',
      line,
      coins,
      turn: current.kind === 'talk' ? current.turn + 1 : 1,
    }));
  };

  const endShift = (result: ShiftEnd) => {
    if (result === 'gaveUp') {
      // A shift opened straight from another conversation goes back to the game, rather than to a
      // second greeting.
      if (startJob) {
        dialog.current?.close();
      } else {
        backToHost('greeting');
      }
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
        // Escape stops a shift and goes back to its host, rather than leaving the place, unless the
        // shift was opened straight from another conversation.
        if (isShift && !startJob) {
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
          return (
            <ShiftOpenedDirectly value={startJob !== undefined}>
              <Shift onDone={endShift} />
            </ShiftOpenedDirectly>
          );
        })()
      ) : (
        <SpeechBox
          nameId="shift-host"
          name={t('name')}
          title={t('title')}
          portrait={<SellerPortrait stock={host} />}
        >
          <TypedLine
            key={extraSaid ? `extra-${view.turn}` : view.turn}
            text={extraSaid ?? t(`lines.${view.line}`, { name: playerName, coins: view.coins })}
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
            {extra && extraSaid === null && (
              <button
                type="button"
                onClick={() => {
                  if (extra.doneLine === null) {
                    extra.onPress();
                    return;
                  }
                  setExtraSaid(extra.doneLine);
                  // The button goes, and the focus with it.
                  requestAnimationFrame(() => dialog.current && focusFirstChoice(dialog.current));
                }}
                className={`${CHOICE_CLASS} bg-ui-stamp! text-ui-paper`}
              >
                {extra.label}
              </button>
            )}
            <button type="submit" className={CHOICE_CLASS}>
              {t('leave')}
            </button>
          </form>
        </SpeechBox>
      )}
    </dialog>
  );
}
