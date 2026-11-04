'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { BUS_STOPS, type BusStop, type BusStopId } from '@/game/bus';
import { moveThroughChoices } from './menu-focus';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

type Props = {
  // The stop the player is reading the map at.
  here: BusStopId;
  onTravel: (stop: BusStop) => void;
  onClose: () => void;
};

const ROUTE_GREEN = '#3f8a6a';

// Where each stop sits on the drawn map, from left to right along the route.
const MAP_SPOTS: Record<BusStopId, { x: number; y: number }> = {
  mainStreet: { x: 80, y: 140 },
  park: { x: 296, y: 46 },
};
const ROUTE = `M${MAP_SPOTS.mainStreet.x} ${MAP_SPOTS.mainStreet.y} C 170 150, 200 40, ${MAP_SPOTS.park.x} ${MAP_SPOTS.park.y}`;

// The map of the stops the bus serves, read on the stop's sign: the route drawn on paper, and the
// stops to ride to.
export function BusMap({ here, onTravel, onClose }: Props) {
  const t = useTranslations('Bus');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="bus-map-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto w-[min(32rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="px-4 pt-5 pb-5 sm:px-6">
        <h2 id="bus-map-title" className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xl">{t('title')}</span>
          <span className="-rotate-2 rounded-xs bg-[#3f8a6a] px-2 text-ui-paper">{t('line')}</span>
        </h2>
        {/* The route, drawn like a little paper map of the town. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 400 170"
          className="mt-3 w-full rounded-md bg-[#eef1e6] shadow-[2px_3px_0_var(--ui-shadow)]"
        >
          {/* The town, its houses along the main street. */}
          <path d="M0 152 Q110 132 200 150 T400 142 V170 H0Z" fill="#c8a574" fillOpacity="0.45" />
          <path
            d="M18 122 Q24 94 68 98 Q118 88 152 110 Q166 138 122 148 Q64 156 30 144 Q12 136 18 122Z"
            fill="#e9dcc4"
          />
          {(
            [
              [34, '#e9b8a4'],
              [70, '#f6e7c4'],
              [106, '#bfe0d0'],
            ] as const
          ).map(([houseX, color]) => (
            <g key={houseX}>
              <path d={`M${houseX} 108 l14 -12 l14 12 v18 h-28z`} fill={color} />
              <path
                d={`M${houseX - 2} 109 l16 -14 l16 14`}
                fill="none"
                stroke="#c8453a"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            </g>
          ))}
          {/* The park: a lawn with its lake, and trees here and there. */}
          <path
            d="M246 62 Q252 22 302 22 Q352 14 380 42 Q398 74 386 112 Q374 152 318 150 Q262 156 246 122 Q234 94 246 62Z"
            fill="#b5d9a8"
          />
          <ellipse cx="318" cy="102" rx="44" ry="24" fill="#8cc3e6" />
          <ellipse cx="306" cy="96" rx="16" ry="5" fill="#fff" fillOpacity="0.45" />
          {[
            [262, 46],
            [366, 40],
            [258, 128],
            [380, 124],
            [350, 62],
            [232, 92],
            [392, 78],
          ].map(([treeX, treeY]) => (
            <g key={`${treeX}-${treeY}`}>
              <rect x={treeX - 2} y={treeY} width="4" height="10" fill="#8a5a35" />
              <circle cx={treeX} cy={treeY - 2} r="9" fill="#579552" />
            </g>
          ))}
          {/* The bus's route, from the main street up to the park. */}
          <path d={ROUTE} fill="none" stroke={ROUTE_GREEN} strokeWidth="9" strokeLinecap="round" />
          <path d={ROUTE} fill="none" stroke="#fbf6ea" strokeWidth="2" strokeDasharray="8 8" />
          {BUS_STOPS.map(({ id }) => (
            <g key={id}>
              <circle
                cx={MAP_SPOTS[id].x}
                cy={MAP_SPOTS[id].y}
                r="13"
                fill="#fbf6ea"
                stroke={ROUTE_GREEN}
                strokeWidth="5"
              />
              {id === here && (
                <circle cx={MAP_SPOTS[id].x} cy={MAP_SPOTS[id].y} r="5" fill="#c8453a" />
              )}
            </g>
          ))}
        </svg>
        <ul className="mt-4 grid gap-2.5">
          {BUS_STOPS.map((stop) => {
            const isHere = stop.id === here;
            return (
              <li
                key={stop.id}
                className="flex items-center justify-between gap-3 rounded-xs bg-[#efe6d2] px-3 py-2 shadow-[2px_3px_0_var(--ui-shadow)] odd:-rotate-[0.5deg] even:rotate-[0.5deg]"
              >
                <span className="font-display text-lg">{t(`stops.${stop.id}`)}</span>
                {isHere ? (
                  <span className="rotate-2 rounded-xs bg-ui-stamp px-2 text-ui-paper">
                    {t('here')}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onTravel(stop)}
                    className={`${CHOICE_CLASS} bg-[#3f8a6a] text-ui-paper`}
                  >
                    {t('goTo')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <form method="dialog" className="mt-4 flex">
          <button
            type="submit"
            // biome-ignore lint/a11y/noAutofocus: the map is closed with the keyboard too.
            autoFocus
            className={CHOICE_CLASS}
          >
            {t('close')}
          </button>
        </form>
      </TornPaper>
    </dialog>
  );
}
