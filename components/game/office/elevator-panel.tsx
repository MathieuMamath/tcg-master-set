'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { OFFICE_FLOORS, type OfficeFloor, type SidePlaceId } from '@/game/world/side-rooms';
import { moveThroughChoices } from '../menu-focus';

type Props = {
  // The floor the lift is called from, shown lit and not to be chosen.
  here: SidePlaceId;
  onChoose: (floor: OfficeFloor) => void;
  onClose: () => void;
};

const FLOOR_KEYS: Record<number, 'street' | 'office' | 'coupons'> = {
  0: 'street',
  1: 'office',
  2: 'coupons',
};

// The panel inside the administrative office's lift: a round button for each floor, from the top
// down, the one the player is on lit up, and a button to stay.
export function ElevatorPanel({ here, onChoose, onClose }: Props) {
  const t = useTranslations('Elevator');
  const dialog = useRef<HTMLDialogElement>(null);
  const floors = [...OFFICE_FLOORS].reverse();

  useEffect(() => {
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLElement>('button:not([aria-disabled="true"])')?.focus();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="elevator-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[min(22rem,calc(100%-2rem))] max-w-none overflow-visible rounded-2xl bg-linear-to-b from-[#c3c8cf] to-[#9aa0a8] p-5 font-game text-ui-ink shadow-[4px_6px_0_var(--ui-shadow)] ring-2 ring-[#7d838c] backdrop:bg-ui-ink/50"
    >
      <h2 id="elevator-title" className="text-center font-display text-xl">
        {t('title')}
      </h2>
      <ul className="mt-4 grid gap-3">
        {floors.map((floor) => {
          const isHere = floor.place === here;
          const key = FLOOR_KEYS[floor.floor] ?? 'street';
          return (
            <li key={floor.floor}>
              <button
                type="button"
                aria-disabled={isHere}
                onClick={() => {
                  if (!isHere) {
                    onChoose(floor);
                  }
                }}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl bg-[#5b6470] px-3 py-2 text-left text-ui-paper outline-none focus-visible:ring-4 focus-visible:ring-[#f3c14b] aria-disabled:cursor-default"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full border-4 font-digits text-xl font-bold ${
                    isHere
                      ? 'border-[#f3c14b] bg-[#f3c14b] text-ui-ink shadow-[0_0_12px_#f3c14b]'
                      : 'border-[#cfd4da] bg-[#3e4651] group-hover:border-[#f3c14b]'
                  }`}
                >
                  {floor.floor}
                </span>
                <span className="flex flex-col">
                  <span className="text-lg leading-tight">{t(`floors.${key}`)}</span>
                  {isHere && <span className="text-sm text-[#f3c14b]">{t('here')}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <form method="dialog" className="mt-4 text-center">
        <button
          type="submit"
          className="cursor-pointer ui-paper-button bg-ui-paper px-4 py-1 font-semibold outline-offset-2 focus-visible:outline-2"
        >
          {t('stay')}
        </button>
      </form>
    </dialog>
  );
}
