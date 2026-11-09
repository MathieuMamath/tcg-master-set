import { useTranslations } from 'next-intl';
import { canClaimDailyBonus, DAILY_QUEST_GOAL, type DailyActivity } from '@/game/quests/activity';
import { ClockBadge, type GameClock } from '../scene/game-clock';
import { ActivityIcon } from './activity-dialog';
import { AnimatedCount } from './animated-count';
import { BinderIcon, BoosterIcon, CoinIcon } from './hud-icons';

type Props = {
  username: string;
  coins: number;
  boosters: number;
  activity: DailyActivity;
  clock: GameClock | null;
  clockOffset: number;
  onOpenBag: () => void;
  onOpenBinder: () => void;
  onOpenSettings: () => void;
  onOpenActivity: () => void;
};

// The scraps along the top of the screen: the player's name and coins, the buttons to the boosters
// and the binder on the left, and the settings, the day's quests and the clock on the right.
export function TopBar({
  username,
  coins,
  boosters,
  activity,
  clock,
  clockOffset,
  onOpenBag,
  onOpenBinder,
  onOpenSettings,
  onOpenActivity,
}: Props) {
  const t = useTranslations('Game');
  const tBooster = useTranslations('Booster');
  const tSettings = useTranslations('Settings');
  const tActivity = useTranslations('Activity');
  // Quests past the bonus's six are extra, so the count stops there.
  const done = Math.min(activity.done.length, DAILY_QUEST_GOAL);

  return (
    <div className="absolute inset-x-4 top-5 flex items-start justify-between gap-3 font-game text-ui-ink">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <p className="ui-tape max-w-44 -rotate-2 truncate ui-scrap px-3 pt-1.5 pb-1 font-display text-lg">
          {username}
        </p>
        <p className="relative flex rotate-1 items-center gap-1.5 ui-scrap px-3 py-1 font-digits text-base font-bold">
          <CoinIcon />
          <AnimatedCount value={coins} format={(count) => t('coins', { count })} />
        </p>
        <button
          type="button"
          disabled={boosters === 0}
          aria-label={`${t('boosters', { count: boosters })}. ${tBooster('title')}`}
          onClick={onOpenBag}
          aria-keyshortcuts="B"
          className="relative flex -rotate-1 items-center gap-1.5 ui-paper-button bg-ui-paper px-3 py-1 font-digits text-base font-bold enabled:cursor-pointer enabled:bg-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <BoosterIcon />
          <AnimatedCount value={boosters} format={(count) => t('boosters', { count })} />
        </button>
        <button
          type="button"
          onClick={onOpenBinder}
          aria-keyshortcuts="C"
          className="flex rotate-1 cursor-pointer items-center gap-1.5 ui-paper-button bg-ui-paper px-3 py-1 font-digits text-base font-bold"
        >
          <BinderIcon />
          {t('binderButton')}
        </button>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        <button
          type="button"
          aria-label={tSettings('open')}
          onClick={onOpenSettings}
          aria-keyshortcuts="Escape"
          className="shrink-0 rotate-2 cursor-pointer ui-paper-button bg-ui-paper p-1.5"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
            {[0, 45, 90, 135].map((angle) => (
              <path
                key={angle}
                d="M12 1v22"
                stroke="currentColor"
                strokeWidth="4"
                transform={`rotate(${angle} 12 12)`}
              />
            ))}
            <circle cx="12" cy="12" r="7" fill="currentColor" />
            <circle cx="12" cy="12" r="3" fill="var(--ui-paper)" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={tActivity('open', { done, total: DAILY_QUEST_GOAL })}
          onClick={onOpenActivity}
          className="relative flex -rotate-1 cursor-pointer items-center gap-1.5 ui-paper-button bg-ui-paper px-3 py-1 font-digits text-base font-bold"
        >
          <ActivityIcon />
          {done}/{DAILY_QUEST_GOAL}
          {/* A reward waits to be claimed. */}
          {canClaimDailyBonus(activity) && (
            <span
              aria-hidden="true"
              className="ui-bob absolute -top-1.5 -right-1.5 size-3.5 rounded-full border-2 border-ui-paper bg-ui-stamp"
            />
          )}
        </button>
        {clock && <ClockBadge offset={clockOffset} clock={clock} />}
      </div>
    </div>
  );
}
