'use client';

import { useTranslations } from 'next-intl';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { SetId } from '@/game/card-sets';
import { type PullTier, stageCount, stageDuration } from '@/game/pull-tier';
import { PackBody, packEdgeStyle } from './pack-art';
import { SparksCanvas, useSparks } from './pull-sparks';

const RAINBOW = ['#ff5f6d', '#ffc83d', '#6fe08a', '#5fb7ff', '#b57bff', '#ff5f9e'];
const TIER_COLORS: readonly string[] = ['#6fc3ff', '#b57bff', '#ffc83d', '#ff5f9e', '#ffffff'];
const FLASH_MILLISECONDS = 350;
const FIRST_RAINBOW_TIER = 4;

export function tierColor(tier: PullTier): string {
  return TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)];
}

export function tierColors(tier: PullTier): readonly string[] {
  return tier >= FIRST_RAINBOW_TIER ? RAINBOW : [tierColor(tier), '#ffffff'];
}

// The rainbow of the top tiers, or the single colour of the others, seen through thin rays.
export function PullRays({ tier, className = '' }: { tier: PullTier; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`ui-pull-rays-mask pointer-events-none absolute ${className}`}
    >
      <span
        className="ui-pull-rays absolute inset-0"
        style={{
          background:
            tier >= FIRST_RAINBOW_TIER
              ? `conic-gradient(${[...RAINBOW, RAINBOW[0]].join(', ')})`
              : tierColor(tier),
        }}
      />
    </span>
  );
}

type Props = {
  setId: SetId;
  setName: string;
  logoUrl: string | null;
  tier: PullTier;
  isGodPack: boolean;
  onDone: () => void;
};

// Between the cut and the first card: the light from the open pack climbs one stage at a time up
// to the tier of the pack, so that the player only slowly finds out how good it is.
export function PullScene({ setId, setName, logoUrl, tier, isGodPack, onDone }: Props) {
  const t = useTranslations('Booster');
  const { canvas, emit } = useSparks();
  const slit = useRef<HTMLSpanElement>(null);
  const [stage, setStage] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const stages = stageCount(tier);
  const stageTier = stage as PullTier;
  const showsGodPack = isGodPack && stage === stages - 1;

  useEffect(() => {
    const isStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = stageDuration(isStill);
    const timers = [
      ...Array.from({ length: stages - 1 }, (_, index) =>
        setTimeout(() => setStage(index + 1), duration * (index + 1)),
      ),
      setTimeout(() => setIsFlashing(true), duration * stages),
      setTimeout(onDone, duration * stages + (isStill ? 0 : FLASH_MILLISECONDS)),
    ];

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [onDone, stages]);

  // A burst at each new stage, then a steady stream of glints out of the open pack.
  useEffect(() => {
    const emitFromSlit = (count: number, speed: number, spread: number) => {
      const box = slit.current?.getBoundingClientRect();
      if (box) {
        emit({
          x: box.left + box.width / 2,
          y: box.top,
          count,
          colors: tierColors(stageTier),
          speed,
          spread,
        });
      }
    };
    emitFromSlit(30 + stage * 35, 260 + stage * 110, Math.PI * 1.6);
    const stream = setInterval(() => emitFromSlit(4 + stage * 2, 340 + stage * 60, 0.9), 70);

    return () => clearInterval(stream);
  }, [emit, stage, stageTier]);

  return (
    <div
      style={
        {
          '--pull-color': tierColor(stageTier),
          '--pull-shake': `${stage * 1.5}px`,
          ...packEdgeStyle(setId),
        } as CSSProperties
      }
      className="fixed inset-0 z-10 overflow-hidden"
    >
      {/* Mounted anew at each stage, which replays its jolt and its ring. */}
      <div
        key={stage}
        className={`absolute inset-0 flex items-center justify-center ${
          stage > 0 ? 'ui-pull-jolt' : ''
        }`}
      >
        <div
          aria-hidden="true"
          className="ui-pull-tint pointer-events-none absolute inset-0"
          style={{ opacity: 0.2 + stage * 0.1 }}
        />
        {stage > 0 && (
          <span style={{ opacity: Math.min(0.2 + stage * 0.15, 0.85) }} className="contents">
            <PullRays tier={stageTier} className="top-1/2 left-1/2 size-[220vmax] -translate-1/2" />
          </span>
        )}
        <div className="relative flex flex-col items-center gap-6">
          <div
            className={`relative aspect-[5/7.6] w-[min(calc(100vw-2rem),47vh,22.5rem)] ${
              stage > 0 ? 'ui-pull-shake' : ''
            }`}
          >
            <span
              aria-hidden="true"
              className="ui-pull-beam pointer-events-none absolute inset-x-[2%] bottom-[87%] h-[70vh]"
              style={{ opacity: 0.45 + stage * 0.1 }}
            />
            <PackBody setId={setId} setName={setName} logoUrl={logoUrl} cut={1} />
            <span
              ref={slit}
              aria-hidden="true"
              className="absolute inset-x-0 top-[13%] h-1 bg-ui-paper shadow-[0_0_1.5rem_0.4rem_var(--pull-color)]"
            />
            <span
              aria-hidden="true"
              className="ui-pull-ring pointer-events-none absolute top-[13%] left-1/2 aspect-square w-full rounded-full border-8"
              style={{ borderColor: 'var(--pull-color)' }}
            />
          </div>
          <div className="flex h-14 flex-col items-center justify-center gap-1">
            {showsGodPack && (
              <p className="ui-god-pack-banner rounded-full border-4 border-ui-ink bg-ui-accent px-5 py-0.5 text-2xl font-bold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]">
                {t('godPack')}
              </p>
            )}
          </div>
        </div>
      </div>
      <SparksCanvas canvas={canvas} />
      {isFlashing && (
        <div
          aria-hidden="true"
          className="ui-pull-flash pointer-events-none fixed inset-0 z-40"
          style={{ background: stage >= 3 ? '#ffffff' : 'var(--pull-color)' }}
        />
      )}
      <button
        type="button"
        onClick={onDone}
        className="absolute inset-0 z-50 flex cursor-pointer items-end justify-center pb-4 text-ui-paper/70 outline-none hover:text-ui-paper focus-visible:text-ui-paper"
      >
        {t('skip')}
      </button>
    </div>
  );
}
