'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { DAILY_QUESTS } from '@/game/activity';
import type { PlayableSet } from '@/game/card-sets';
import { STATS_PERIODS, type StatsPeriod } from '@/game/stats';
import type { GameStats, SeriesPoint } from '@/stats/game-stats';
import { moveThroughChoices } from './menu-focus';
import { CardDropPanel } from './stats-cards';
import { TimeChart } from './stats-charts';

const TABS = ['economy', 'boosters', 'quests', 'players', 'cards', 'log'] as const;
type Tab = (typeof TABS)[number];

// The outcomes the statistics know how to name. Anything else shows as recorded.
const KNOWN_OUTCOMES = new Set([
  'rewarded',
  'won',
  'lost',
  'item',
  'treasure',
  'coins',
  'booster',
  'none',
  'alreadyPaid',
  'carved',
  'broken',
  'jackpot',
  'prize',
]);
const KNOWN_PLACES = new Set([
  'bedroom',
  'town',
  'shop',
  'bookshop',
  'flat',
  'arcade',
  'park',
  'downtown',
  'bureau',
]);

// The reports show on Mme Hulotte's computer, a dark dashboard on its screen, unlike the game's
// paper dialogs.
const TILE_CLASS = 'rounded-md bg-[#141c2b] px-3 py-2 ring-1 ring-[#26324a]';
const FOCUS_CLASS =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fc0ff]';
const BUTTON_CLASS = `cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors ${FOCUS_CLASS}`;

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className={TILE_CLASS}>
      <p className="text-sm text-[#9aa7ba]">{label}</p>
      <p
        className={`font-digits text-2xl font-bold ${
          tone === 'gain' ? 'text-[#5fd39a]' : tone === 'loss' ? 'text-[#ff8a7a]' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// Labelled bars, each as long as its share of the largest.
function Bars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  const format = useFormatter();
  const largest = Math.max(1, ...rows.map(({ value }) => value));
  if (rows.length === 0) {
    return <p className="text-[#9aa7ba]">{empty}</p>;
  }
  return (
    <ul className="grid gap-1.5">
      {rows.map(({ label, value }) => (
        <li key={label} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-2">
          <span className="truncate">{label}</span>
          <span className="h-2.5 rounded-full bg-[#26324a]">
            <span
              className="block h-full rounded-full bg-[#3987e5]"
              style={{ width: `${(value / largest) * 100}%` }}
            />
          </span>
          <span className="font-digits font-bold tabular-nums">{format.number(value)}</span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

type Props = {
  sets: readonly PlayableSet[];
  onClose: () => void;
};

// Mme Hulotte's reports: the game's statistics by period, read from the server, which only lets
// admins have them, and only in aggregate.
export function StatsDialog({ sets, onClose }: Props) {
  const t = useTranslations('Stats');
  const tQuests = useTranslations('Activity.quests');
  const format = useFormatter();
  const dialog = useRef<HTMLDialogElement>(null);
  const firstButton = useRef<HTMLButtonElement>(null);
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [tab, setTab] = useState<Tab>('economy');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
    firstButton.current?.focus();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    setHasFailed(false);
    fetch(`/api/stats?period=${period}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((loaded: GameStats) => isCurrent && setStats(loaded))
      .catch(() => isCurrent && setHasFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [period]);

  const questName = (questId: string) => {
    const giver = DAILY_QUESTS.find(({ id }) => id === questId)?.giver;
    return giver ? tQuests(`${giver}.name`) : questId;
  };
  const sourceName = (source: string) =>
    source === 'daily-bonus' ||
    source === 'duplicates' ||
    source === 'boosters' ||
    source === 'binders'
      ? t(`sources.${source}`)
      : questName(source);
  const setName = (setId: string) => sets.find(({ id }) => id === setId)?.name ?? setId;
  const outcomeName = (outcome: string) =>
    KNOWN_OUTCOMES.has(outcome) ? t(`outcomes.${outcome}` as 'outcomes.won') : outcome;
  const placeName = (place: string) =>
    KNOWN_PLACES.has(place) ? t(`places.${place}` as 'places.town') : place;

  // The chart's steps, named in the player's language: hours, days, or the weeks' Mondays.
  const points = stats?.series.points ?? [];
  const stepLabels = points.map(({ key }) => {
    if (stats?.series.unit === 'hour') {
      return format.dateTime(new Date(`${key}:00:00Z`), { hour: 'numeric', timeZone: 'UTC' });
    }
    const day = format.dateTime(new Date(`${key}T12:00:00Z`), {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    return stats?.series.unit === 'week' ? t('charts.weekOf', { day }) : day;
  });
  const seriesOf = (field: Exclude<keyof SeriesPoint, 'key'>) =>
    points.map((point) => point[field]);

  const earned = stats?.economy.earned.reduce((total, { coins }) => total + coins, 0) ?? 0;
  const spent = stats?.economy.spent.reduce((total, { coins }) => total + coins, 0) ?? 0;

  return (
    <dialog
      ref={dialog}
      aria-labelledby="stats-title"
      onClose={onClose}
      onKeyDown={moveThroughChoices}
      className="ui-pop-in m-auto max-h-[calc(100dvh-1rem)] w-[min(60rem,calc(100%-1rem))] max-w-none overflow-visible bg-transparent font-[system-ui,sans-serif] text-[#e6ebf2] backdrop:bg-ui-ink/50"
    >
      {/* The monitor: its bezel, with a light under the screen, and its stand. */}
      <div className="rounded-2xl bg-linear-to-b from-[#3a3f48] to-[#24272d] p-2.5 pb-5 shadow-[0_10px_30px_rgb(0_0_0/45%)] ring-1 ring-[#4b515c] sm:p-3.5 sm:pb-6">
        <div className="relative flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-md bg-[#0d1320] ring-1 ring-black">
          {/* The app's window bar. */}
          <div className="flex shrink-0 items-center gap-3 border-b border-[#26324a] bg-[#182133] py-1.5 pr-3 pl-4 sm:pl-6">
            <h2 id="stats-title" className="min-w-0 flex-1 truncate text-sm font-semibold">
              {t('title')}
            </h2>
            <form method="dialog">
              <button
                type="submit"
                className={`${BUTTON_CLASS} bg-[#26324a] text-[#e6ebf2] hover:bg-[#33415e]`}
              >
                {t('close')}
              </button>
            </form>
          </div>
          <div className="overflow-y-auto px-4 pt-3 pb-5 sm:px-6">
            <p className="text-sm text-[#9aa7ba]">{t('aggregateNote')}</p>
            {/* The period the figures cover. */}
            <fieldset className="mt-3 flex flex-wrap gap-2">
              <legend className="sr-only">{t('periodLabel')}</legend>
              {STATS_PERIODS.map((choice, index) => (
                <button
                  key={choice}
                  ref={index === 0 ? firstButton : undefined}
                  type="button"
                  aria-pressed={period === choice}
                  onClick={() => setPeriod(choice)}
                  className={`${BUTTON_CLASS} ${
                    period === choice
                      ? 'bg-[#3987e5] text-white'
                      : 'bg-[#1c2638] text-[#c5cfdc] hover:bg-[#26324a]'
                  }`}
                >
                  {t(`periods.${choice}`)}
                </button>
              ))}
            </fieldset>
            <div
              role="tablist"
              aria-label={t('title')}
              className="mt-4 flex flex-wrap gap-1 border-b border-[#26324a]"
            >
              {TABS.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="tab"
                  id={`stats-tab-${choice}`}
                  aria-selected={tab === choice}
                  aria-controls="stats-panel"
                  onClick={() => setTab(choice)}
                  className={`-mb-px cursor-pointer border-b-2 px-3 pt-1.5 pb-1.5 text-sm ${FOCUS_CLASS} ${
                    tab === choice
                      ? 'border-[#3987e5] font-semibold text-[#e6ebf2]'
                      : 'border-transparent text-[#9aa7ba] hover:text-[#e6ebf2]'
                  }`}
                >
                  {t(`tabs.${choice}`)}
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id="stats-panel"
              aria-labelledby={`stats-tab-${tab}`}
              aria-busy={!stats && !hasFailed}
              className="min-h-72 pt-2"
            >
              {tab !== 'cards' && hasFailed && <p className="mt-4">{t('error')}</p>}
              {tab !== 'cards' && !hasFailed && !stats && (
                <p className="mt-4 text-[#9aa7ba]">{t('loading')}</p>
              )}
              {!hasFailed && stats && tab === 'economy' && (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Tile label={t('economy.earned')} value={format.number(earned)} tone="gain" />
                    <Tile label={t('economy.spent')} value={format.number(spent)} tone="loss" />
                    <Tile
                      label={t('economy.net')}
                      value={format.number(earned - spent, { signDisplay: 'exceptZero' })}
                      tone={earned >= spent ? 'gain' : 'loss'}
                    />
                  </div>
                  <TimeChart
                    title={t('charts.coins')}
                    kind="line"
                    labels={stepLabels}
                    series={[
                      { label: t('economy.earned'), values: seriesOf('earned') },
                      { label: t('economy.spent'), values: seriesOf('spent') },
                    ]}
                  />
                  <Section title={t('economy.balances')}>
                    <p className="mb-2 text-sm text-[#9aa7ba]">
                      {t('economy.balancesHint', { players: stats.economy.balances.players })}
                    </p>
                    <div className="mb-3 grid gap-2 sm:grid-cols-2">
                      <Tile
                        label={t('economy.averageBalance')}
                        value={
                          stats.economy.balances.average === null
                            ? '–'
                            : format.number(stats.economy.balances.average)
                        }
                      />
                      <Tile
                        label={t('economy.medianBalance')}
                        value={
                          stats.economy.balances.median === null
                            ? '–'
                            : format.number(stats.economy.balances.median)
                        }
                      />
                    </div>
                    <Bars
                      empty={t('empty')}
                      rows={
                        stats.economy.balances.players === 0
                          ? []
                          : stats.economy.balances.bands.map(({ from, players }, index, bands) => {
                              const next = bands[index + 1];
                              return {
                                label: next
                                  ? t('economy.band', {
                                      from: format.number(from),
                                      to: format.number(next.from - 1),
                                    })
                                  : t('economy.bandFrom', { from: format.number(from) }),
                                value: players,
                              };
                            })
                      }
                    />
                  </Section>
                  <Section title={t('economy.earnedBySource')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.economy.earned
                        .map(({ source, coins }) => ({ label: sourceName(source), value: coins }))
                        .sort((first, second) => second.value - first.value)}
                    />
                  </Section>
                  <Section title={t('economy.spentOn')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.economy.spent.map(({ source, coins }) => ({
                        label: sourceName(source),
                        value: coins,
                      }))}
                    />
                  </Section>
                </>
              )}
              {!hasFailed && stats && tab === 'boosters' && (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <Tile
                      label={t('boosters.bought')}
                      value={format.number(stats.boosters.bought)}
                    />
                    <Tile
                      label={t('boosters.opened')}
                      value={format.number(stats.boosters.opened)}
                    />
                    <Tile
                      label={t('boosters.newCards')}
                      value={format.number(stats.boosters.newCards)}
                    />
                    <Tile
                      label={t('boosters.godPacks')}
                      value={format.number(stats.boosters.godPacks)}
                    />
                  </div>
                  <TimeChart
                    title={t('charts.boosters')}
                    kind="line"
                    labels={stepLabels}
                    series={[
                      { label: t('boosters.bought'), values: seriesOf('bought') },
                      { label: t('boosters.opened'), values: seriesOf('opened') },
                    ]}
                  />
                  <Section title={t('boosters.bySet')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.boosters.bySet.map(({ setId, opened }) => ({
                        label: setName(setId),
                        value: opened,
                      }))}
                    />
                  </Section>
                  <Section title={t('boosters.bestPulls')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.boosters.tiers.map(({ tier, count }) => ({
                        label: t('boosters.tier', { tier }),
                        value: count,
                      }))}
                    />
                  </Section>
                </>
              )}
              {!hasFailed && stats && tab === 'quests' && (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Tile
                      label={t('quests.dailyBonuses')}
                      value={format.number(stats.dailyBonuses)}
                    />
                  </div>
                  <TimeChart
                    title={t('charts.quests')}
                    kind="columns"
                    labels={stepLabels}
                    series={[{ label: t('charts.finished'), values: seriesOf('finished') }]}
                  />
                  <Section title={t('quests.byQuest')}>
                    {stats.quests.length === 0 ? (
                      <p className="text-[#9aa7ba]">{t('empty')}</p>
                    ) : (
                      <ul className="grid gap-2">
                        {stats.quests.map((quest) => (
                          <li key={quest.questId} className={TILE_CLASS}>
                            <p className="font-semibold">{questName(quest.questId)}</p>
                            <p className="font-digits text-sm text-[#c5cfdc]">
                              {t('quests.counts', {
                                started: quest.started,
                                finished: quest.finished,
                                rejected: quest.rejected,
                              })}
                            </p>
                            {quest.outcomes.length > 0 && (
                              <p className="mt-1 flex flex-wrap gap-1.5 text-sm">
                                {quest.outcomes.map(({ outcome, count }) => (
                                  <span key={outcome} className="rounded-full bg-[#26324a] px-2">
                                    {outcomeName(outcome)} · {format.number(count)}
                                  </span>
                                ))}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Section>
                </>
              )}
              {!hasFailed && stats && tab === 'players' && (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <Tile label={t('players.visits')} value={format.number(stats.players.visits)} />
                    <Tile
                      label={t('players.averageVisit')}
                      value={
                        stats.players.averageVisitSeconds === null
                          ? '–'
                          : t('players.minutes', {
                              minutes: Math.round(stats.players.averageVisitSeconds / 60),
                            })
                      }
                    />
                    <Tile label={t('players.active')} value={format.number(stats.players.active)} />
                    <Tile
                      label={t('players.signUps')}
                      value={format.number(stats.players.signUps)}
                    />
                    <Tile
                      label={t('players.signIns')}
                      value={format.number(stats.players.signIns)}
                    />
                  </div>
                  <TimeChart
                    title={t('charts.active')}
                    kind="columns"
                    labels={stepLabels}
                    series={[{ label: t('players.active'), values: seriesOf('active') }]}
                  />
                  <Section title={t('players.devices')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.players.devices.map(({ device, visits }) => ({
                        label:
                          device === 'phone' || device === 'desktop'
                            ? t(`players.deviceNames.${device}`)
                            : device,
                        value: visits,
                      }))}
                    />
                  </Section>
                  <Section title={t('players.referrers')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.players.referrers.map(({ referrer, visits }) => ({
                        label: referrer ?? t('players.direct'),
                        value: visits,
                      }))}
                    />
                  </Section>
                  <Section title={t('players.locales')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.players.locales.map(({ locale: language, visits }) => ({
                        label:
                          language === 'fr' || language === 'en'
                            ? t(`players.localeNames.${language}`)
                            : language,
                        value: visits,
                      }))}
                    />
                  </Section>
                  <Section title={t('players.places')}>
                    <Bars
                      empty={t('empty')}
                      rows={stats.players.places.map(({ place, visits }) => ({
                        label: placeName(place),
                        value: visits,
                      }))}
                    />
                  </Section>
                </>
              )}
              {tab === 'cards' && <CardDropPanel sets={sets} />}
              {!hasFailed && stats && tab === 'log' && (
                <Section title={t('log.title')}>
                  <p className="mb-2 text-sm text-[#9aa7ba]">{t('log.hint')}</p>
                  <ul className="grid gap-1.5">
                    {stats.events.map(({ type, count, lastAt }) => (
                      <li
                        key={type}
                        className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-md px-3 py-1.5 ${
                          lastAt ? 'bg-[#141c2b]' : 'bg-[#3a1f26] ring-1 ring-[#7a3440]'
                        }`}
                      >
                        <code className="truncate font-digits text-sm">{type}</code>
                        <span className="font-digits font-bold tabular-nums">
                          {format.number(count)}
                        </span>
                        <span className="text-sm text-[#9aa7ba]">
                          {lastAt
                            ? format.dateTime(new Date(lastAt), {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : t('log.neverSeen')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </div>
        </div>
        <span aria-hidden="true" className="mx-auto mt-2 block h-1 w-1 rounded-full bg-[#5fd39a]" />
      </div>
      <div
        aria-hidden="true"
        className="mx-auto h-5 w-24 bg-linear-to-b from-[#2b2f36] to-[#3a3f48]"
      />
      <div
        aria-hidden="true"
        className="mx-auto h-2.5 w-56 rounded-t-lg bg-[#3a3f48] shadow-[0_6px_14px_rgb(0_0_0/40%)]"
      />
    </dialog>
  );
}
