'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  canClaimDailyBonus,
  DAILY_BONUS_COINS,
  DAILY_QUEST_GOAL,
  DAILY_QUESTS,
  type DailyActivity,
  type DailyQuestGiver,
} from '@/game/activity';
import { CoinIcon } from './hud-icons';
import { moveThroughChoices } from './menu-focus';
import { SellerPortrait } from './seller-portrait';
import { CHOICE_CLASS, TornPaper } from './shop-dialog';

// A clipboard with its list ticked off, for the tracker's button.
export function ActivityIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <rect x="4" y="3" width="16" height="19" rx="2.5" fill="#c4935c" />
      <rect x="6" y="5.5" width="12" height="14.5" rx="1" fill="#fffdf6" />
      <rect x="8.5" y="1.5" width="7" height="4" rx="1.2" fill="#7f5530" />
      {[9, 13, 17].map((lineY, index) => (
        <g key={lineY}>
          <path
            d={`M7.6 ${lineY} l1.2 1.2 l2 -2.2`}
            fill="none"
            stroke={index < 2 ? '#3f7d48' : '#c9bfae'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d={`M12.5 ${lineY} h4`} stroke="#c9bfae" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// The arcade machine gives no face to show, so its quest shows the ball.
function BallPortrait() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="size-full bg-[#2c2a35]">
      <circle cx="20" cy="20" r="13" fill="#e8792b" />
      <path
        d="M7 20h26M20 7v26M10.5 11c4 3.5 4 14.5 0 18M29.5 11c-4 3.5-4 14.5 0 18"
        fill="none"
        stroke="#8a3f12"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function QuestPortrait({ giver }: { giver: DailyQuestGiver }) {
  if (giver === 'basketball') {
    return <BallPortrait />;
  }
  // The ramen shop's three jobs are all Yuzu's.
  const isRamen = giver === 'ramenDishes' || giver === 'ramenKitchen' || giver === 'ramenService';
  return <SellerPortrait stock={isRamen ? 'ramenChef' : giver} />;
}

type Props = {
  activity: DailyActivity;
  onClaim: () => Promise<boolean>;
  onClose: () => void;
};

// The activity tracker: for now a single tab, the day's quests, and the bonus for doing them all.
export function ActivityDialog({ activity, onClaim, onClose }: Props) {
  const t = useTranslations('Activity');
  const dialog = useRef<HTMLDialogElement>(null);
  const firstButton = useRef<HTMLButtonElement>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const doneCount = activity.done.length;
  const canClaim = canClaimDailyBonus(activity);

  useEffect(() => {
    dialog.current?.showModal();
    firstButton.current?.focus();
  }, []);

  const claim = async () => {
    if (!canClaim || isClaiming) {
      return;
    }
    setIsClaiming(true);
    await onClaim();
    setIsClaiming(false);
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby="activity-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-game text-ui-ink backdrop:bg-ui-ink/50"
    >
      <TornPaper className="max-h-[calc(100dvh-2.5rem)] overflow-y-auto px-4 pt-5 pb-6 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id="activity-title" className="font-display text-2xl">
            {t('title')}
          </h2>
          <form method="dialog">
            <button type="submit" className={CHOICE_CLASS}>
              {t('close')}
            </button>
          </form>
        </div>
        {/* Only one tab for now: the others will come with what they track. */}
        <div
          role="tablist"
          aria-label={t('title')}
          className="mt-3 flex gap-2 border-b-2 border-ui-ink/15"
        >
          <button
            ref={firstButton}
            type="button"
            role="tab"
            aria-selected="true"
            id="activity-tab-daily"
            aria-controls="activity-panel-daily"
            className="-mb-0.5 cursor-default rounded-t-md border-2 border-b-0 border-ui-ink/15 bg-[#fff6dc] px-4 pt-1.5 pb-1 text-lg outline-offset-2"
          >
            {t('tabs.daily')}
          </button>
        </div>
        <div
          role="tabpanel"
          id="activity-panel-daily"
          aria-labelledby="activity-tab-daily"
          className="pt-4"
        >
          {/* The day's bonus, and how far along it is. */}
          <section
            aria-labelledby="activity-bonus"
            className="rounded-md bg-[linear-gradient(#fff3c4,#f6dd94)] p-4 shadow-[3px_4px_0_var(--ui-shadow)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 id="activity-bonus" className="font-display text-lg">
                  {t('bonus.title')}
                </h3>
                <p className="flex items-center gap-1.5 text-lg">
                  <CoinIcon />
                  {t('bonus.reward', { count: DAILY_BONUS_COINS, goal: DAILY_QUEST_GOAL })}
                </p>
              </div>
              <button
                type="button"
                // Not `disabled`, which would take the focus away from the keyboard.
                aria-disabled={!canClaim || isClaiming}
                onClick={claim}
                className={`${CHOICE_CLASS} ${
                  canClaim ? 'ui-bob bg-ui-stamp! text-ui-paper' : 'cursor-default! opacity-60'
                }`}
              >
                {activity.isBonusClaimed ? t('bonus.claimed') : t('bonus.claim')}
              </button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ol aria-hidden="true" className="flex gap-1.5">
                {Array.from({ length: DAILY_QUEST_GOAL }, (_, index) => (
                  <li
                    // biome-ignore lint/suspicious/noArrayIndexKey: one mark per quest to go, in order.
                    key={index}
                    className={`grid size-7 place-items-center rounded-full border-2 font-digits text-sm font-bold ${
                      index < doneCount
                        ? 'border-[#3f7d48] bg-[#3f7d48] text-ui-paper'
                        : 'border-ui-ink/25 bg-ui-paper/70 text-ui-ink/40'
                    }`}
                  >
                    {index < doneCount ? '✓' : index + 1}
                  </li>
                ))}
              </ol>
              <p className="font-digits font-bold">
                {t('bonus.progress', {
                  done: Math.min(doneCount, DAILY_QUEST_GOAL),
                  total: DAILY_QUEST_GOAL,
                })}
              </p>
            </div>
          </section>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {DAILY_QUESTS.map(({ giver }) => {
              const isDone = activity.done.includes(giver);
              return (
                <li
                  key={giver}
                  className={`flex items-center gap-3 rounded-md p-2.5 shadow-[2px_3px_0_var(--ui-shadow)] ${
                    isDone ? 'bg-[#e6efe1]' : 'bg-[#f5efe2]'
                  }`}
                >
                  <span className="size-12 shrink-0 overflow-hidden rounded-full border-3 border-ui-paper bg-[#e7d9bc] ring-2 ring-[#8e6b3e]">
                    <QuestPortrait giver={giver} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display">{t(`quests.${giver}.name`)}</span>
                    <span className="block text-sm text-ui-ink/70">
                      {t(`quests.${giver}.where`)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rotate-[-6deg] rounded-sm border-2 px-1.5 text-sm font-bold uppercase ${
                      isDone ? 'border-[#3f7d48] text-[#3f7d48]' : 'border-ui-ink/30 text-ui-ink/45'
                    }`}
                  >
                    {isDone ? t('status.done') : t('status.todo')}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-ui-ink/65">{t('resetHint')}</p>
        </div>
      </TornPaper>
    </dialog>
  );
}
