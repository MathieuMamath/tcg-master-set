'use client';

import { useFormatter } from 'next-intl';
import { type PointerEvent, useId, useState } from 'react';

// The charts are drawn for the dark screen of Mme Hulotte's computer. The two series colours are
// the dark steps of a palette checked for colour blindness and against that screen: blue first,
// orange second. Text never takes a series colour; a swatch beside it carries the identity.
export const SERIES_COLORS = ['#3987e5', '#d95926'] as const;

const WIDTH = 640;
const HEIGHT = 200;
const PAD = { left: 44, right: 12, top: 14, bottom: 26 };
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;
const GRID = '#2a3548';
const INK_SECONDARY = '#9aa7ba';
export const SCREEN_SURFACE = '#141c2b';
const X_LABELS = 6;

export type ChartSeries = { label: string; values: readonly number[] };

// The top of the scale: a round number just above the largest value, whose half is round too, so
// that the grid reads easily. Counts never get a half step below one.
function scaleTop(largest: number): number {
  if (largest <= 2) {
    return 2;
  }
  const magnitude = 10 ** Math.floor(Math.log10(largest));
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= largest) {
      return step * magnitude;
    }
  }
  return 10 * magnitude;
}

type Props = {
  title: string;
  kind: 'line' | 'columns';
  // Each step's name, such as a day or an hour, already in the player's language.
  labels: readonly string[];
  series: readonly ChartSeries[];
};

// A chart over time, with one axis: lines for comparing two series, or columns for one. Pointing
// at a step shows its values; a table carries the same figures for screen readers.
export function TimeChart({ title, kind, labels, series }: Props) {
  const format = useFormatter();
  const id = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const steps = labels.length;
  const top = scaleTop(Math.max(0, ...series.flatMap(({ values }) => values)));
  const band = PLOT_WIDTH / steps;
  const xOf = (index: number) => PAD.left + band * (index + 0.5);
  const yOf = (value: number) => PAD.top + PLOT_HEIGHT - (value / top) * PLOT_HEIGHT;
  const labelEvery = Math.max(1, Math.ceil(steps / X_LABELS));

  const pointAt = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!box) {
      return;
    }
    const x = ((event.clientX - box.left) / box.width) * WIDTH;
    setHovered(Math.min(steps - 1, Math.max(0, Math.floor((x - PAD.left) / band))));
  };

  return (
    <figure className="mt-4">
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        {series.length > 1 && (
          <span className="flex flex-wrap gap-3 text-sm">
            {series.map(({ label }, index) => (
              <span key={label} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-1 w-4 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[index] }}
                />
                {label}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <div className="relative">
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full rounded-md bg-[#141c2b] ring-1 ring-[#26324a]"
        >
          {/* The grid: hairlines at zero, half and the top of the scale. */}
          {[0, 0.5, 1].map((share) => (
            <g key={share}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yOf(top * share)}
                y2={yOf(top * share)}
                stroke={GRID}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={yOf(top * share) + 4}
                textAnchor="end"
                fontSize="11"
                fill={INK_SECONDARY}
              >
                {format.number(top * share, { notation: 'compact' })}
              </text>
            </g>
          ))}
          {labels.map((label, index) =>
            // Counted back from the last step, so that it always shows, never crowded by another.
            (steps - 1 - index) % labelEvery === 0 ? (
              <text
                key={label}
                x={xOf(index)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="11"
                fill={INK_SECONDARY}
              >
                {label}
              </text>
            ) : null,
          )}
          {hovered !== null && (
            <line
              x1={xOf(hovered)}
              x2={xOf(hovered)}
              y1={PAD.top}
              y2={PAD.top + PLOT_HEIGHT}
              stroke={INK_SECONDARY}
              strokeOpacity="0.4"
              strokeWidth="1"
            />
          )}
          {kind === 'columns'
            ? series[0]?.values.map((value, index) => {
                const columnWidth = Math.max(2, band * 0.6);
                const x = xOf(index) - columnWidth / 2;
                const y = yOf(value);
                const height = PAD.top + PLOT_HEIGHT - y;
                const radius = Math.min(4, columnWidth / 2, height);
                return value > 0 ? (
                  <path
                    // biome-ignore lint/suspicious/noArrayIndexKey: one column per step.
                    key={index}
                    // Rounded at its top only, its foot on the baseline.
                    d={`M${x} ${y + height} V${y + radius} Q${x} ${y} ${x + radius} ${y} H${x + columnWidth - radius} Q${x + columnWidth} ${y} ${x + columnWidth} ${y + radius} V${y + height}Z`}
                    fill={SERIES_COLORS[0]}
                    fillOpacity={hovered === null || hovered === index ? 1 : 0.55}
                  />
                ) : null;
              })
            : series.map(({ label, values }, seriesIndex) => (
                <g key={label}>
                  <path
                    d={values
                      .map(
                        (value, index) => `${index === 0 ? 'M' : 'L'}${xOf(index)} ${yOf(value)}`,
                      )
                      .join(' ')}
                    fill="none"
                    stroke={SERIES_COLORS[seriesIndex]}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {hovered !== null && (
                    <circle
                      cx={xOf(hovered)}
                      cy={yOf(values[hovered] ?? 0)}
                      r="4.5"
                      fill={SERIES_COLORS[seriesIndex]}
                      stroke={SCREEN_SURFACE}
                      strokeWidth="2"
                    />
                  )}
                </g>
              ))}
          {/* What the pointer finds its step with, wider than any mark. */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={PLOT_WIDTH}
            height={PLOT_HEIGHT}
            fill="transparent"
            onPointerMove={pointAt}
            onPointerDown={pointAt}
            onPointerLeave={() => setHovered(null)}
          />
        </svg>
        {hovered !== null && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1 rounded-md bg-[#e6ebf2] px-2.5 py-1.5 text-sm text-[#141c2b] shadow-lg"
            style={{
              left: `${(xOf(hovered) / WIDTH) * 100}%`,
              transform: `translateX(${xOf(hovered) > WIDTH / 2 ? 'calc(-100% - 10px)' : '10px'})`,
            }}
          >
            <p className="font-semibold">{labels[hovered]}</p>
            {series.map(({ label, values }, index) => (
              <p key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: SERIES_COLORS[index] }}
                />
                {label}
                <span className="ml-auto pl-3 font-digits font-bold">
                  {format.number(values[hovered] ?? 0)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
      {/* The same figures, for screen readers. */}
      <table className="sr-only" aria-labelledby={`${id}-caption`}>
        <caption id={`${id}-caption`}>{title}</caption>
        <thead>
          <tr>
            <th scope="col" />
            {series.map(({ label }) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, index) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {series.map(({ label: seriesLabel, values }) => (
                <td key={seriesLabel}>{values[index]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
