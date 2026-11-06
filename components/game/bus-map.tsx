'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { BUS_STOPS, type BusStop, type BusStopId } from '@/game/bus';
import { moveThroughChoices, openDialog } from './menu-focus';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

type Props = {
  // The stop the player is reading the map at.
  here: BusStopId;
  onTravel: (stop: BusStop) => void;
  onClose: () => void;
};

const ROUTE_GREEN = '#3f8a6a';

// Where each stop sits on the drawn map: downtown on the left, the village in the middle and the
// park on the right, along the route.
const MAP_SPOTS: Record<BusStopId, { x: number; y: number }> = {
  downtown: { x: 72, y: 112 },
  mainStreet: { x: 200, y: 140 },
  park: { x: 318, y: 58 },
};
const ROUTE = `M${MAP_SPOTS.downtown.x} ${MAP_SPOTS.downtown.y} C 110 150, 160 152, ${MAP_SPOTS.mainStreet.x} ${MAP_SPOTS.mainStreet.y} S 286 80, ${MAP_SPOTS.park.x} ${MAP_SPOTS.park.y}`;

// Downtown's towers on the map, as tall paper blocks.
const MAP_TOWERS = [
  { x: 22, width: 20, height: 52, color: '#7fa7c9' },
  { x: 46, width: 24, height: 78, color: '#4f5d70' },
  { x: 74, width: 18, height: 60, color: '#4f9a96' },
  { x: 96, width: 24, height: 70, color: '#c9c6bf' },
  { x: 122, width: 16, height: 46, color: '#7fa7c9' },
];

// The map of the stops the bus serves, read on the stop's sign: the route drawn on paper, and the
// stops to ride to.
export function BusMap({ here, onTravel, onClose }: Props) {
  const t = useTranslations('Bus');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    openDialog(dialog.current);
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
          {/* Downtown, its towers on a grey block. */}
          <path
            d="M8 112 Q6 40 30 30 Q90 18 136 34 Q150 70 142 112 Q120 126 70 124 Q20 126 8 112Z"
            fill="#d9dbe6"
          />
          {MAP_TOWERS.map(({ x, width, height, color }) => (
            <g key={x}>
              <rect x={x} y={110 - height} width={width} height={height} rx="2" fill={color} />
              {Array.from({ length: Math.floor(height / 14) }, (_, floor) => (
                <rect
                  // biome-ignore lint/suspicious/noArrayIndexKey: the floors never change.
                  key={floor}
                  x={x + 4}
                  y={110 - height + 6 + floor * 14}
                  width={width - 8}
                  height="5"
                  fill="#fff"
                  fillOpacity="0.4"
                />
              ))}
            </g>
          ))}
          {/* The village, its houses along the main street. */}
          <path
            d="M146 122 Q152 98 196 102 Q240 94 262 116 Q272 146 232 156 Q182 166 156 152 Q140 140 146 122Z"
            fill="#e9dcc4"
          />
          {(
            [
              [160, '#e9b8a4'],
              [192, '#f6e7c4'],
              [224, '#bfe0d0'],
            ] as const
          ).map(([houseX, color]) => (
            <g key={houseX}>
              <path d={`M${houseX} 124 l12 -10 l12 10 v16 h-24z`} fill={color} />
              <path
                d={`M${houseX - 2} 125 l14 -12 l14 12`}
                fill="none"
                stroke="#c8453a"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
            </g>
          ))}
          {/* The park: a lawn with its lake, and trees here and there. */}
          <path
            d="M276 52 Q280 16 322 16 Q368 12 388 38 Q400 70 390 104 Q380 134 334 132 Q288 136 276 108 Q266 82 276 52Z"
            fill="#b5d9a8"
          />
          <ellipse cx="336" cy="92" rx="36" ry="20" fill="#8cc3e6" />
          <ellipse cx="326" cy="87" rx="13" ry="4" fill="#fff" fillOpacity="0.45" />
          {[
            [290, 40],
            [372, 34],
            [286, 112],
            [384, 110],
            [358, 56],
            [392, 74],
          ].map(([treeX, treeY]) => (
            <g key={`${treeX}-${treeY}`}>
              <rect x={treeX - 2} y={treeY} width="4" height="10" fill="#8a5a35" />
              <circle cx={treeX} cy={treeY - 2} r="8" fill="#579552" />
            </g>
          ))}
          {/* The bus's route, from downtown through the village up to the park. */}
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
                <>
                  <circle cx={MAP_SPOTS[id].x} cy={MAP_SPOTS[id].y} r="5" fill="#c8453a" />
                  {/* A little flag planted on the stop where the player is. */}
                  <g transform={`translate(${MAP_SPOTS[id].x} ${MAP_SPOTS[id].y})`}>
                    <path d="M0 0 V-34" stroke="#5a3e2a" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M1 -34 L22 -27 L1 -19Z" fill="#c8453a" />
                    <path
                      d="M1 -34 L22 -27 L1 -19Z"
                      fill="#fff"
                      fillOpacity="0.2"
                      transform="translate(0 -3) scale(1 0.6)"
                    />
                  </g>
                </>
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
                    className={`${CHOICE_CLASS} bg-[#3f8a6a]! text-ui-paper`}
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
            // The map is closed with the keyboard too.
            data-first-focus
            className={CHOICE_CLASS}
          >
            {t('close')}
          </button>
        </form>
      </TornPaper>
    </dialog>
  );
}
