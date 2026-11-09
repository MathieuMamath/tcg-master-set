'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Player } from '@/auth/session';
import type { MemoryCard } from '@/cards/memory-cards';
import type { PlayableSet } from '@/game/cards/card-sets';
import { boosterCount, totalBoosters, type Wallet } from '@/game/cards/shop-dialogue';
import type { DailyActivity } from '@/game/quests/activity';
import type { DalgonaShape, Press } from '@/game/quests/dalgona';
import type { MemoryStatus } from '@/game/quests/memory-game';
import { nextProverb, pickProverb } from '@/game/quests/proverbs';
import { pickStains, questDay, type Stain, scrubStain } from '@/game/quests/quests';
import { stopAt } from '@/game/world/bus';
import { weatherAt } from '@/game/world/clock';
import { STILL } from '@/game/world/movement';
import {
  isDoorInteraction,
  OFFICE_FLOORS,
  type OfficeFloor,
  type SidePlaceId,
} from '@/game/world/side-rooms';
import type { PlayerSpot } from '@/game/world/spot';
import type { Interaction } from '@/game/world/world';
import type { DailyBonusClaim } from '@/player/activity';
import type { PlayerProgress } from '@/player/progress';
import type { BasketballResult } from '@/player/quests/basketball';
import type { DalgonaResult } from '@/player/quests/dalgona';
import type { FishingCatch } from '@/player/quests/fishing';
import type { RaffleDraw } from '@/player/quests/raffle';
import { BinderView } from './boosters/binder-view';
import { BoosterBag } from './boosters/booster-bag';
import { BoosterOpening } from './boosters/booster-opening';
import { useBoosterOpening } from './boosters/use-booster-opening';
import { ActivityDialog } from './hud/activity-dialog';
import { BusMap } from './hud/bus-map';
import { ControlsLegend } from './hud/controls-legend';
import { InteractionPrompts } from './hud/interaction-prompts';
import { Joystick } from './hud/joystick';
import { NewsSheet } from './hud/news-sheet';
import { SaveNotice, useSaveNotice } from './hud/save-notice';
import { SettingsMenu } from './hud/settings-menu';
import { SleepScreen, useSleep } from './hud/sleep';
import { TopBar } from './hud/top-bar';
import { useNews } from './hud/use-news';
import { CouponRegister } from './office/coupon-register';
import { ElevatorPanel } from './office/elevator-panel';
import { StatsDialog } from './office/stats-dialog';
import { PlayerNameContext } from './player-name';
import { BasketballDialog } from './quests/basketball-dialog';
import { DalgonaDialog } from './quests/dalgona-dialog';
import { FishingDialog } from './quests/fishing-dialog';
import { MemoryDialog } from './quests/memory-dialog';
import { PuzzleDialog } from './quests/puzzle-dialog';
import { QuestBanner } from './quests/quest-banner';
import { QuestDialog, type QuestLine } from './quests/quest-dialog';
import { QuizDialog } from './quests/quiz-dialog';
import { RaffleDialog } from './quests/raffle-dialog';
import { useKittenHunt } from './quests/use-kitten-hunt';
import { WateringDialog } from './quests/watering-dialog';
import { useGameClock, WeatherLayer } from './scene/game-clock';
import type { MovementInput } from './scene/stage';
import { ShiftDialog } from './shifts/shift-dialog';
import { NpcDialog } from './shop/npc-dialog';
import { SellerConversation } from './shop/seller-conversation';
import type { Talk } from './talk';
import { type GameKeyControls, useGameKeys } from './use-game-keys';
import { useVisitReports } from './use-visit-reports';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const PaperScene = dynamic(
  () => import('./scene/paper-scene').then((module) => module.PaperScene),
  {
    ssr: false,
  },
);

// The places under the open sky, where the weather falls and the night darkens the world.
const OUTSIDE: ReadonlySet<SidePlaceId> = new Set(['town', 'park', 'downtown']);

// Where the character stands gives no advantage, so a save that fails is simply let go.
function saveSpot(spot: PlayerSpot) {
  return fetch('/api/player/spot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(spot),
  }).catch(() => {});
}

type Props = {
  player: Player;
  sets: readonly PlayableSet[];
  progress: PlayerProgress;
};

export function Game({ player, sets, progress }: Props) {
  const t = useTranslations('Game');
  const input = useRef<MovementInput>({
    keyboard: STILL,
    joystick: STILL,
    wantsDash: false,
    wantsScrub: false,
    travelTo: null,
    wantsDoor: false,
  });
  // What the scene says the character can do where it stands, before the game's own state hides
  // what can't be done now, such as a hiding place with no kitten to look for.
  const [reached, setInteraction] = useState<Interaction | null>(null);
  const [talkingTo, setTalkingTo] = useState<Talk | null>(null);
  const [quest, setQuest] = useState<{ startedAt: number; stains: readonly Stain[] } | null>(null);
  const [questLine, setQuestLine] = useState<QuestLine>('greeting');
  const [memoryCards, setMemoryCards] = useState<readonly MemoryCard[] | null>(null);
  const [grandpaLine, setGrandpaLine] = useState<QuestLine>('greeting');
  const [cleanedOn, setCleanedOn] = useState(progress.cleanedOn);
  // The saying Papy Caillou shares once beaten, picked anew at each visit to the park.
  const [proverb, setProverb] = useState(() => pickProverb());
  const [isFishing, setIsFishing] = useState(false);
  const [boyLine, setBoyLine] = useState<QuestLine>('greeting');
  const [isPlayingBasketball, setIsPlayingBasketball] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [isQuizzing, setIsQuizzing] = useState(false);
  const [isPuzzling, setIsPuzzling] = useState(false);
  // The shape Gaspard handed over, while the player carves it.
  const [dalgonaShape, setDalgonaShape] = useState<DalgonaShape | null>(null);
  const [gaspardLine, setGaspardLine] = useState<QuestLine>('greeting');
  const [isRaffling, setIsRaffling] = useState(false);
  const [bereniceLine, setBereniceLine] = useState<QuestLine>('greeting');
  const [raffleDrawnOn, setRaffleDrawnOn] = useState(progress.raffleDrawnOn);
  const [isBusMapOpen, setIsBusMapOpen] = useState(false);
  const [isElevatorOpen, setIsElevatorOpen] = useState(false);
  // The game's clock, moved on by the player's sleeps, and the night's sleep while it lasts.
  const [clockOffset, setClockOffset] = useState(progress.clockOffset);
  const clock = useGameClock(clockOffset);
  // The scene only loads in the browser, so it can read the weather before the first check.
  const skyClock = useMemo(
    () => ({ offset: clockOffset, weather: clock?.weather ?? weatherAt(new Date(), clockOffset) }),
    [clockOffset, clock?.weather],
  );
  // Where the character is, for the bus map to know which stop it is read at.
  const [place, setPlace] = useState<SidePlaceId>(progress.spot?.place ?? 'bedroom');
  // Where the character stands, kept by the scene, for saving it when the page is left.
  const spot = useRef<PlayerSpot | null>(progress.spot);
  const [highScore, setHighScore] = useState(progress.basketballHighScore);
  const [basketballRewardedOn, setBasketballRewardedOn] = useState(progress.basketballRewardedOn);
  const [binders, setBinders] = useState(progress.binders);
  const isTalking = talkingTo !== null;
  const [wallet, setWallet] = useState(progress.wallet);
  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isCouponRegisterOpen, setIsCouponRegisterOpen] = useState(false);
  const [activity, setActivity] = useState(progress.activity);
  const [collection, setCollection] = useState(progress.collection);
  const { isSaving, showSaveNotice } = useSaveNotice();
  const locale = useLocale();
  const tSpeakers = useTranslations('Speakers');
  const tShopkeeper = useTranslations('Shopkeeper');
  const tStones = useTranslations('Stones');
  const tBalloons = useTranslations('Balloons');
  const tGarden = useTranslations('Garden');
  const tTown = useTranslations('Town');
  const tBus = useTranslations('Bus');
  const stopWalking = () => {
    input.current.keyboard = STILL;
    input.current.joystick = STILL;
  };
  const { newsShown, closeNews, showAllNews } = useNews();
  const { sleep, goToBed } = useSleep(clock?.canSleep ?? false, stopWalking, setClockOffset);
  const { opening, pickBooster, cutBooster, closeOpening } = useBoosterOpening({
    sets,
    locale,
    stopWalking,
    setIsBagOpen,
    setWallet,
    setCollection,
    showSaveNotice,
  });
  const kitten = useKittenHunt({
    isHintGiven: progress.isKittenHunted,
    activity,
    talkingTo,
    reached,
    spot,
    stopWalking,
    setWallet,
    setActivity,
    showSaveNotice,
  });
  useVisitReports(locale, talkingTo, spot);
  // Beaten for the day, Papy Caillou only shares a saying: there is nothing to talk about.
  // Papy's memory game, won for the day, as the day's activity says: read again from the server
  // whenever a dialog closes, so that it never drifts from the database.
  const isMemoryWon = activity.done.includes('grandpa');
  const interaction = reached === 'search' && !kitten.isKittenHunted ? null : reached;
  const isPapySaying = interaction === 'grandpa' && isMemoryWon;
  const isDialogOpen =
    isTalking ||
    newsShown !== null ||
    isBinderOpen ||
    isBagOpen ||
    isSettingsOpen ||
    isActivityOpen ||
    isStatsOpen ||
    isCouponRegisterOpen ||
    opening !== null ||
    memoryCards !== null ||
    isFishing ||
    isPlayingBasketball ||
    isWatering ||
    isQuizzing ||
    isPuzzling ||
    kitten.isKittenFound ||
    dalgonaShape !== null ||
    isRaffling ||
    isBusMapOpen ||
    isElevatorOpen ||
    sleep !== null;
  const ownedBoosters = sets
    .map((set) => ({ ...set, count: boosterCount(wallet, set.id) }))
    .filter(({ count }) => count > 0);
  const boosterTotal = totalBoosters(wallet);
  const bubble = useRef<HTMLElement>(null);
  const isFinishingQuest = useRef(false);
  const controls = useRef<GameKeyControls>({
    interaction,
    isDialogOpen,
    hasBoosters: boosterTotal > 0,
    interact: () => {},
    openBag: () => {},
    openBinder: () => {},
    openSettings: () => {},
  });
  controls.current = {
    interaction,
    isDialogOpen,
    hasBoosters: boosterTotal > 0,
    interact: () => interact(),
    openBag: () => openBag(),
    openBinder: () => openBinder(),
    openSettings: () => openSettings(),
  };
  useGameKeys(input, controls);

  // The full card statistics, downloaded as a CSV file in the player's language.
  const downloadCardStats = () => {
    const link = document.createElement('a');
    link.href = `/api/stats/cards/export?locale=${locale}`;
    link.download = '';
    link.click();
  };

  const interact = () => {
    stopWalking();
    if (interaction === 'binder') {
      setIsBinderOpen(true);
    } else if (isDoorInteraction(interaction)) {
      input.current.wantsDoor = true;
    } else if (interaction === 'basketball') {
      setIsPlayingBasketball(true);
    } else if (interaction === 'scrub') {
      input.current.wantsScrub = true;
    } else if (interaction === 'busStop') {
      setIsBusMapOpen(true);
    } else if (interaction === 'elevator') {
      setIsElevatorOpen(true);
    } else if (interaction === 'bed') {
      goToBed();
    } else if (interaction === 'search') {
      kitten.searchHere();
    } else if (interaction) {
      setTalkingTo(interaction);
    }
  };

  const openBinder = () => {
    stopWalking();
    setIsBinderOpen(true);
  };

  const startQuest = async (): Promise<QuestLine | null> => {
    try {
      const response = await fetch('/api/quests/grandma/start', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { hasStarted } = await response.json();
      if (!hasStarted) {
        setCleanedOn(questDay(new Date()));
        return 'alreadyDone';
      }
      isFinishingQuest.current = false;
      setQuest({ startedAt: Date.now(), stains: pickStains() });
      setQuestLine('hurry');
      return null;
    } catch {
      return 'unavailable';
    }
  };

  const finishQuest = async () => {
    setQuest(null);
    stopWalking();
    try {
      const response = await fetch('/api/quests/grandma/finish', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { isRewarded, wallet: updated } = await response.json();
      setWallet(updated);
      if (isRewarded) {
        showSaveNotice();
        setCleanedOn(questDay(new Date()));
      }
      setQuestLine(isRewarded ? 'rewarded' : 'failed');
    } catch {
      setQuestLine('unavailable');
    }
    setTalkingTo('grandma');
  };

  // One rub on a patch of dust. The last patch gone finishes the quest, only once.
  const scrub = (id: number) => {
    if (!quest || isFinishingQuest.current) {
      return;
    }
    const left = scrubStain(quest.stains, id);
    if (left.length === 0) {
      isFinishingQuest.current = true;
      finishQuest();
    } else {
      setQuest({ ...quest, stains: left });
    }
  };

  // Stepping out of Léa's flat gives up on the quest, since the dust stays inside.
  // Saved at each change of place, rather than at every step, so as not to flood the server.
  const changePlace = useCallback(
    (arrived: PlayerSpot) => {
      const next = arrived.place;
      showSaveNotice(saveSpot(arrived));
      setPlace(next);
      if (next === 'park') {
        setProverb((previous) => nextProverb(previous));
      }
      if (next !== 'flat') {
        setQuest(null);
        setQuestLine((line) => (line === 'hurry' ? 'greeting' : line));
      }
    },
    [showSaveNotice],
  );

  // Stable, so that the banner's timer isn't restarted at each render.
  const timeUp = useCallback(() => {
    setQuest(null);
    setQuestLine('failed');
    input.current.keyboard = STILL;
    input.current.joystick = STILL;
    setTalkingTo('grandma');
  }, []);

  const startMemoryGame = async (): Promise<QuestLine | null> => {
    try {
      const response = await fetch(`/api/quests/grandpa/start?locale=${locale}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { hasStarted, cards } = await response.json();
      if (!hasStarted) {
        return 'alreadyDone';
      }
      setMemoryCards(cards);
      setGrandpaLine('greeting');
      return null;
    } catch {
      return 'unavailable';
    }
  };

  const endMemoryGame = (ending: { status: MemoryStatus; wallet: Wallet } | null) => {
    setMemoryCards(null);
    if (ending?.status === 'won') {
      showSaveNotice();
      setActivity((current) =>
        current.done.includes('grandpa')
          ? current
          : { ...current, done: [...current.done, 'grandpa'] },
      );
    }
    if (ending) {
      setWallet(ending.wallet);
    }
    setGrandpaLine(ending ? (ending.status === 'won' ? 'rewarded' : 'failed') : 'unavailable');
    setTalkingTo('grandpa');
  };

  // The server works out the score from the shots, and pays for it. This only shows the result.
  const finishBasketball = async (shots: readonly number[]): Promise<BasketballResult | null> => {
    try {
      const response = await fetch('/api/quests/basketball/finish', {
        method: 'POST',
        body: JSON.stringify({ shots }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result: BasketballResult = await response.json();
      setWallet(result.wallet);
      setHighScore(result.highScore);
      if (result.reward !== 'none') {
        setBasketballRewardedOn(questDay(new Date()));
      }
      if (result.isNewHighScore || result.reward !== 'none') {
        showSaveNotice();
      }
      return result;
    } catch {
      return null;
    }
  };

  // The server picks the shape and remembers when the game started.
  const startDalgona = async (): Promise<QuestLine | null> => {
    try {
      const response = await fetch('/api/quests/dalgona/start', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const answer: { hasStarted: boolean; shape?: DalgonaShape } = await response.json();
      if (!answer.hasStarted || !answer.shape) {
        return 'alreadyDone';
      }
      setDalgonaShape(answer.shape);
      return null;
    } catch {
      return 'unavailable';
    }
  };

  // The server replays the presses and pays for a shape carved whole. This only shows the result.
  const finishDalgona = async (presses: readonly Press[]): Promise<DalgonaResult | null> => {
    try {
      const response = await fetch('/api/quests/dalgona/finish', {
        method: 'POST',
        body: JSON.stringify({ presses }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result: DalgonaResult = await response.json();
      if (result.coins > 0) {
        showSaveNotice();
      }
      return result;
    } catch {
      return null;
    }
  };

  const endDalgona = (line: QuestLine, result?: DalgonaResult) => {
    setDalgonaShape(null);
    if (result) {
      setWallet(result.wallet);
    }
    setGaspardLine(line);
    setTalkingTo('gaspard');
  };

  // One turn of the drum a day: once drawn, Bérénice only says to come back tomorrow.
  const startRaffle = async (): Promise<QuestLine | null> => {
    if (raffleDrawnOn === questDay(new Date())) {
      return 'alreadyDone';
    }
    setIsRaffling(true);
    return null;
  };

  // The server draws the ball and pays for it. This only shows the result.
  const drawRaffle = async (): Promise<RaffleDraw | null> => {
    try {
      const response = await fetch('/api/quests/raffle/draw', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const draw: RaffleDraw = await response.json();
      setRaffleDrawnOn(questDay(new Date()));
      if (draw.hasDrawn && draw.coins > 0) {
        showSaveNotice();
      }
      return draw;
    } catch {
      return null;
    }
  };

  const endRaffle = (line: QuestLine | null, draw?: RaffleDraw) => {
    setIsRaffling(false);
    if (draw) {
      setWallet(draw.wallet);
    }
    if (line) {
      setBereniceLine(line);
      setTalkingTo('berenice');
    }
  };

  const startFishing = async (): Promise<QuestLine | null> => {
    try {
      const response = await fetch('/api/quests/fishing/start', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { hasStarted } = await response.json();
      if (!hasStarted) {
        return 'alreadyDone';
      }
      setIsFishing(true);
      return null;
    } catch {
      return 'unavailable';
    }
  };

  // The server draws what comes up on the line and pays for it. This only shows the result.
  const reelIn = async (): Promise<FishingCatch | null> => {
    try {
      const response = await fetch('/api/quests/fishing/catch', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const caught: FishingCatch = await response.json();
      if (caught.item) {
        showSaveNotice();
      }
      return caught;
    } catch {
      return null;
    }
  };

  const endFishing = (line: QuestLine, updated?: Wallet) => {
    setIsFishing(false);
    if (updated) {
      setWallet(updated);
    }
    setBoyLine(line);
    setTalkingTo('boy');
  };

  const openBag = () => {
    stopWalking();
    setIsBagOpen(true);
  };

  // The tracker reads the day's quests again whenever a dialog closes, since most quests end in one.
  const wasDialogOpen = useRef(isDialogOpen);
  useEffect(() => {
    const hasClosed = wasDialogOpen.current && !isDialogOpen;
    wasDialogOpen.current = isDialogOpen;
    if (!hasClosed) {
      return;
    }
    fetch('/api/activity')
      .then((response) => (response.ok ? response.json() : null))
      .then((loaded: DailyActivity | null) => loaded && setActivity(loaded))
      .catch(() => {});
  }, [isDialogOpen]);

  // The server checks that every quest of the day is done, and pays the bonus once.
  const claimDailyBonus = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/activity/claim', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const claim: DailyBonusClaim = await response.json();
      setActivity(claim.activity);
      setWallet(claim.wallet);
      if (claim.isClaimed) {
        showSaveNotice();
      }
      return claim.isClaimed;
    } catch {
      return false;
    }
  };

  // To a floor of the administrative office, or out to the street, by Brutus or the lift.
  const goToFloor = (floor: OfficeFloor) => {
    input.current.travelTo = { to: floor.place, arrival: floor.arrival };
  };

  const openActivity = () => {
    stopWalking();
    setIsActivityOpen(true);
  };

  const openSettings = () => {
    stopWalking();
    setIsSettingsOpen(true);
  };

  return (
    <PlayerNameContext value={player.username}>
      <div className="absolute inset-0">
        <PaperScene
          input={input}
          bubble={bubble}
          webglUnavailable={t('webglUnavailable')}
          signs={{
            shop: tTown('shop'),
            bookshop: tTown('bookshop'),
            arcade: tTown('arcade'),
            busStop: tBus('stops.mainStreet'),
            busLine: tBus('line'),
            parkStop: tBus('stops.park'),
            downtownStop: tBus('stops.downtown'),
            dalgona: tTown('dalgona'),
            post: tTown('post'),
            raffle: tTown('raffle'),
            bureau: tTown('bureau'),
            latest: tShopkeeper('names.latest'),
            thisYear: tShopkeeper('names.thisYear'),
            older: tShopkeeper('names.older'),
            ramen: tTown('ramen'),
            dojo: tTown('dojo'),
          }}
          stains={quest?.stains ?? []}
          isLeaCalm={cleanedOn === questDay(new Date())}
          onInteractionChange={setInteraction}
          onScrub={scrub}
          startSpot={progress.spot}
          spot={spot}
          onPlaceChange={changePlace}
          skyClock={skyClock}
        >
          {clock && <WeatherLayer clock={clock} isOutside={OUTSIDE.has(place)} />}
        </PaperScene>
        <TopBar
          username={player.username}
          coins={wallet.coins}
          boosters={boosterTotal}
          activity={activity}
          clock={clock}
          clockOffset={clockOffset}
          onOpenBag={openBag}
          onOpenBinder={openBinder}
          onOpenSettings={openSettings}
          onOpenActivity={openActivity}
        />
        {!isDialogOpen && (
          <InteractionPrompts
            interaction={interaction}
            username={player.username}
            papySaying={isPapySaying ? proverb : null}
            canSleep={clock?.canSleep ?? false}
            searchNote={kitten.searchNote}
            bubble={bubble}
            onInteract={interact}
          />
        )}
        {/* The game's version, tucked in a corner so that testers can say which one they play. */}
        <p className="pointer-events-none absolute bottom-1 left-2 font-digits text-[0.65rem] text-ui-ink/45 select-none">
          {t('version', { version: process.env.APP_VERSION ?? '' })}
        </p>
        {!isTalking &&
          memoryCards === null &&
          !isFishing &&
          !isPlayingBasketball &&
          dalgonaShape === null &&
          !isRaffling && (
            <>
              <ControlsLegend />
              <Joystick
                onChange={(direction) => {
                  input.current.joystick = direction;
                }}
              />
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                onPointerDown={() => {
                  input.current.wantsDash = true;
                }}
                className="absolute right-8 bottom-20 hidden size-20 touch-none select-none items-center justify-center rounded-full border border-current/30 bg-current/10 font-game font-semibold pointer-coarse:flex"
              >
                {t('dash')}
              </button>
            </>
          )}
        {isBinderOpen && (
          <BinderView
            sets={sets.filter(({ id }) => binders.includes(id))}
            collection={collection}
            onClose={() => setIsBinderOpen(false)}
          />
        )}
        {opening && <BoosterOpening opening={opening} onCut={cutBooster} onClose={closeOpening} />}
        {isBagOpen && (
          <BoosterBag
            boosters={ownedBoosters}
            binders={binders}
            onPick={pickBooster}
            onClose={() => setIsBagOpen(false)}
          />
        )}
        {isSettingsOpen && (
          <SettingsMenu
            sets={sets}
            onRedeemed={(updated) => setWallet(updated)}
            onShowNews={() => {
              setIsSettingsOpen(false);
              showAllNews();
            }}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        {newsShown && <NewsSheet items={newsShown} onClose={closeNews} />}
        {isActivityOpen && (
          <ActivityDialog
            activity={activity}
            onClaim={claimDailyBonus}
            onClose={() => setIsActivityOpen(false)}
          />
        )}
        {quest && !isTalking && (
          <QuestBanner
            startedAt={quest.startedAt}
            stainsLeft={quest.stains.length}
            onTimeUp={timeUp}
          />
        )}
        {talkingTo === 'grandma' && (
          <QuestDialog
            giver="grandma"
            line={questLine}
            onAccept={quest ? null : startQuest}
            onClose={() => {
              setTalkingTo(null);
              if (!quest) {
                setQuestLine((line) =>
                  line === 'rewarded' || line === 'failed' ? 'greeting' : line,
                );
              }
            }}
          />
        )}
        {talkingTo === 'grandpa' && (
          <QuestDialog
            giver="grandpa"
            // His memory game, once won for the day, leaves only his skipping stones to offer.
            line={isMemoryWon ? 'alreadyDone' : grandpaLine}
            onAccept={startMemoryGame}
            extra={{
              label: tStones('jobs.stones'),
              // Papy's skipping stones are a shift of their own, with him as its host, opened
              // straight onto the game.
              onPress: () => setTalkingTo('grandpaStones'),
            }}
            onClose={() => {
              setTalkingTo(null);
              setGrandpaLine((line) =>
                line === 'rewarded' || line === 'failed' ? 'greeting' : line,
              );
            }}
          />
        )}
        {memoryCards && !isTalking && (
          <MemoryDialog
            cards={memoryCards}
            onEnd={endMemoryGame}
            onGiveUp={() => setMemoryCards(null)}
          />
        )}
        {isPuzzling && (
          <PuzzleDialog
            onFinished={(updated) => {
              setWallet(updated);
              showSaveNotice();
            }}
            onClose={() => setIsPuzzling(false)}
          />
        )}
        {isQuizzing && (
          <QuizDialog
            onFinished={(updated) => {
              setWallet(updated);
              showSaveNotice();
            }}
            onClose={() => setIsQuizzing(false)}
          />
        )}
        {isWatering && (
          <WateringDialog
            onWatered={(updated) => {
              setWallet(updated);
              showSaveNotice();
            }}
            onClose={() => setIsWatering(false)}
          />
        )}
        {isPlayingBasketball && (
          <BasketballDialog
            sets={sets}
            highScore={highScore}
            isRewardTaken={basketballRewardedOn === questDay(new Date())}
            onFinish={finishBasketball}
            onClose={() => setIsPlayingBasketball(false)}
          />
        )}
        {talkingTo === 'boy' && (
          <QuestDialog
            giver="boy"
            line={boyLine}
            onAccept={startFishing}
            onClose={() => {
              setTalkingTo(null);
              setBoyLine((line) =>
                line === 'rewarded' || line === 'rewardedShiny' || line === 'failed'
                  ? 'greeting'
                  : line,
              );
            }}
          />
        )}
        {isFishing && !isTalking && (
          <FishingDialog sets={sets} onReelIn={reelIn} onEnd={endFishing} />
        )}
        {talkingTo === 'gaspard' && (
          <QuestDialog
            giver="gaspard"
            line={gaspardLine}
            onAccept={startDalgona}
            onClose={() => {
              setTalkingTo(null);
              setGaspardLine((line) =>
                line === 'rewarded' || line === 'failed' ? 'greeting' : line,
              );
            }}
          />
        )}
        {talkingTo === 'berenice' && (
          <QuestDialog
            giver="berenice"
            line={bereniceLine}
            onAccept={startRaffle}
            extra={{
              label: tBalloons('jobs.balloons'),
              // Her Pop'Balloons is a shift of its own, with her as its host, opened straight onto
              // the game.
              onPress: () => setTalkingTo('bereniceBalloons'),
            }}
            onClose={() => {
              setTalkingTo(null);
              setBereniceLine((line) =>
                line === 'rewarded' || line === 'rewardedShiny' || line === 'lost'
                  ? 'alreadyDone'
                  : line,
              );
            }}
          />
        )}
        {isRaffling && !isTalking && <RaffleDialog onDraw={drawRaffle} onEnd={endRaffle} />}
        {talkingTo === 'brutus' && (
          // Brutus asks admins which floor they are going to, and turns everyone else away. The
          // server checks the role again for everything in the office that matters.
          <NpcDialog
            speaker="brutus"
            line={progress.isAdmin ? 'welcome' : 'refused'}
            actions={
              progress.isAdmin
                ? OFFICE_FLOORS.filter(({ floor }) => floor > 0).map((floor) => ({
                    label: tSpeakers(
                      floor.place === 'coupons' ? 'brutus.coupons' : 'brutus.office',
                    ),
                    onPress: () => goToFloor(floor),
                  }))
                : []
            }
            onClose={() => setTalkingTo(null)}
          />
        )}
        {talkingTo === 'painter' && (
          // Pinceau's puzzle, once a day: done, he only says thank you.
          <NpcDialog
            speaker="painter"
            line={activity.done.includes('painterPuzzle') ? 'done' : 'greeting'}
            action={
              activity.done.includes('painterPuzzle')
                ? undefined
                : { label: tSpeakers('painter.puzzle'), onPress: () => setIsPuzzling(true) }
            }
            onClose={() => setTalkingTo(null)}
          />
        )}
        {talkingTo === 'ronron' && (
          <NpcDialog
            speaker="ronron"
            line={
              activity.done.includes('ronronKitten')
                ? 'thanks'
                : kitten.kittenSpot
                  ? `hints.${kitten.kittenSpot}`
                  : 'worried'
            }
            onClose={() => setTalkingTo(null)}
          />
        )}
        {kitten.isKittenFound && (
          <NpcDialog speaker="kitten" line="found" onClose={kitten.closeKittenFound} />
        )}
        {talkingTo === 'archivist' && (
          // Bastien hands over the full card statistics as a file. The server checks the role again.
          <NpcDialog
            speaker="archivist"
            line="greeting"
            action={{ label: tSpeakers('archivist.export'), onPress: downloadCardStats }}
            onClose={() => setTalkingTo(null)}
          />
        )}
        {talkingTo === 'hulotte' && (
          <NpcDialog
            speaker="hulotte"
            line="greeting"
            action={{ label: tSpeakers('hulotte.reports'), onPress: () => setIsStatsOpen(true) }}
            onClose={() => setTalkingTo(null)}
          />
        )}
        {isStatsOpen && !isTalking && (
          <StatsDialog sets={sets} onClose={() => setIsStatsOpen(false)} />
        )}
        {talkingTo === 'trotte' && (
          <NpcDialog
            speaker="trotte"
            line="greeting"
            action={{
              label: tSpeakers('trotte.register'),
              onPress: () => setIsCouponRegisterOpen(true),
            }}
            onClose={() => setTalkingTo(null)}
          />
        )}
        {isCouponRegisterOpen && !isTalking && (
          <CouponRegister sets={sets} onClose={() => setIsCouponRegisterOpen(false)} />
        )}
        {(talkingTo === 'ramenChef' ||
          talkingTo === 'dojoMaster' ||
          talkingTo === 'gardener' ||
          talkingTo === 'postman' ||
          talkingTo === 'photographer' ||
          talkingTo === 'grandpaStones' ||
          talkingTo === 'bereniceBalloons') && (
          <ShiftDialog
            host={
              talkingTo === 'grandpaStones'
                ? 'grandpa'
                : talkingTo === 'bereniceBalloons'
                  ? 'berenice'
                  : talkingTo
            }
            startJob={
              talkingTo === 'grandpaStones'
                ? 'stones'
                : talkingTo === 'bereniceBalloons'
                  ? 'balloons'
                  : undefined
            }
            extra={
              talkingTo === 'gardener'
                ? {
                    label: tGarden('jobs.watering'),
                    doneLine: activity.done.includes('gardenWatering')
                      ? tGarden('watering.alreadyDone', { name: player.username })
                      : null,
                    // Pépin's flower beds are a chore of their own, once a day.
                    onPress: () => {
                      setTalkingTo(null);
                      setIsWatering(true);
                    },
                  }
                : undefined
            }
            onShiftEnd={(updated, hasPaid) => {
              setWallet(updated);
              if (hasPaid) {
                showSaveNotice();
              }
            }}
            onClose={() => setTalkingTo(null)}
          />
        )}
        {dalgonaShape && !isTalking && (
          <DalgonaDialog shape={dalgonaShape} onFinish={finishDalgona} onEnd={endDalgona} />
        )}
        {talkingTo &&
          talkingTo !== 'grandma' &&
          talkingTo !== 'grandpa' &&
          talkingTo !== 'boy' &&
          talkingTo !== 'gaspard' &&
          talkingTo !== 'berenice' &&
          talkingTo !== 'brutus' &&
          talkingTo !== 'hulotte' &&
          talkingTo !== 'archivist' &&
          talkingTo !== 'trotte' &&
          talkingTo !== 'painter' &&
          talkingTo !== 'ronron' &&
          talkingTo !== 'ramenChef' &&
          talkingTo !== 'dojoMaster' &&
          talkingTo !== 'gardener' &&
          talkingTo !== 'postman' &&
          talkingTo !== 'photographer' &&
          talkingTo !== 'grandpaStones' &&
          talkingTo !== 'bereniceBalloons' && (
            <SellerConversation
              stock={talkingTo}
              sets={sets}
              binders={binders}
              wallet={wallet}
              isQuizDone={activity.done.includes('bookshopQuiz')}
              onStartQuiz={() => {
                setTalkingTo(null);
                setIsQuizzing(true);
              }}
              onWallet={setWallet}
              onBinders={setBinders}
              showSaveNotice={showSaveNotice}
              onClose={() => setTalkingTo(null)}
            />
          )}
        {isElevatorOpen && (
          <ElevatorPanel
            here={place}
            onChoose={(floor) => {
              goToFloor(floor);
              setIsElevatorOpen(false);
            }}
            onClose={() => setIsElevatorOpen(false)}
          />
        )}
        {isBusMapOpen && stopAt(place) && (
          <BusMap
            here={stopAt(place)?.id ?? 'mainStreet'}
            onTravel={({ place: to, arrivalX }) => {
              input.current.travelTo = { to, arrival: { x: arrivalX, facing: 1 } };
              setIsBusMapOpen(false);
            }}
            onClose={() => setIsBusMapOpen(false)}
          />
        )}
        <SaveNotice isSaving={isSaving} />
        <SleepScreen sleep={sleep} name={player.username} />
      </div>
    </PlayerNameContext>
  );
}
