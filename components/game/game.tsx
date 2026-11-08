'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Player } from '@/auth/session';
import type { MemoryCard } from '@/cards/memory-cards';
import { LANDING_REFERRER_KEY } from '@/components/landing-referrer';
import { canClaimDailyBonus, DAILY_QUEST_GOAL, type DailyActivity } from '@/game/activity';
import { addToCollection } from '@/game/binder';
import { stopAt } from '@/game/bus';
import type { PlayableSet, SetId } from '@/game/card-sets';
import { isValidOffset, weatherAt } from '@/game/clock';
import type { DalgonaShape, Press } from '@/game/dalgona';
import type { MemoryStatus } from '@/game/memory-game';
import { isMovementKey, keyboardDirection, STILL } from '@/game/movement';
import { latestNewsId, NEWS, type NewsItem, parseLastSeenId, unreadNews } from '@/game/news';
import { nextProverb, pickProverb } from '@/game/proverbs';
import { pickStains, questDay, type Stain, scrubStain } from '@/game/quests';
import {
  bindersForSale,
  boosterCount,
  type ShopkeeperLine,
  type ShopkeeperStock,
  setsSoldBy,
  totalBoosters,
  type Wallet,
} from '@/game/shop-dialogue';
import {
  isDoorInteraction,
  OFFICE_FLOORS,
  type OfficeFloor,
  type SidePlaceId,
} from '@/game/side-rooms';
import type { PlayerSpot } from '@/game/spot';
import type { Interaction, QuestGiver } from '@/game/world';
import type {
  BasketballResult,
  DailyBonusClaim,
  DalgonaResult,
  FishingCatch,
  PlayerProgress,
  RaffleDraw,
} from '@/player/progress';
import { ActivityDialog, ActivityIcon } from './activity-dialog';
import { AnimatedCount } from './animated-count';
import { BasketballDialog } from './basketball-dialog';
import { BinderView } from './binder-view';
import { BoosterBag } from './booster-bag';
import { BoosterOpening, type Opening } from './booster-opening';
import { BusMap } from './bus-map';
import { CouponRegister } from './coupon-register';
import { DalgonaDialog } from './dalgona-dialog';
import { ElevatorPanel } from './elevator-panel';
import { FishingDialog } from './fishing-dialog';
import { ClockBadge, useGameClock, WeatherLayer } from './game-clock';
import { BinderIcon, BoosterIcon, CoinIcon } from './hud-icons';
import { Joystick } from './joystick';
import { MemoryDialog } from './memory-dialog';
import { NewsSheet } from './news-sheet';
import { NpcDialog, type Speaker } from './npc-dialog';
import type { MovementInput } from './paper-scene';
import { PlayerNameContext } from './player-name';
import { QuestBanner } from './quest-banner';
import { QuestDialog, type QuestLine } from './quest-dialog';
import { RaffleDialog } from './raffle-dialog';
import { reportPlay } from './report';
import { SaveNotice, useSaveNotice } from './save-notice';
import { SettingsMenu } from './settings-menu';
import type { ShiftHost } from './shift';
import { ShiftDialog } from './shift-dialog';
import { ShopDialog } from './shop-dialog';
import { StatsDialog } from './stats-dialog';
import { WateringDialog } from './watering-dialog';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const PaperScene = dynamic(() => import('./paper-scene').then((module) => module.PaperScene), {
  ssr: false,
});

const INTERACT_KEY = 'KeyE';

// Where the browser keeps the id of the last "What's new?" note it showed.
const NEWS_SEEN_KEY = 'tcg-master-set:news-seen';

// Papy Caillou is both a quest giver and the host of the skipping stones, a conversation of its own.
type Talk = ShopkeeperStock | 'binderSeller' | QuestGiver | Speaker | ShiftHost | 'grandpaStones';

// Talking to someone gets a speech bubble over their head, and everything else a prompt at the
// bottom of the screen.
function isTalk(interaction: Interaction): interaction is Extract<Talk, Interaction> {
  return (
    !isDoorInteraction(interaction) &&
    interaction !== 'binder' &&
    interaction !== 'basketball' &&
    interaction !== 'scrub' &&
    interaction !== 'busStop' &&
    interaction !== 'elevator' &&
    interaction !== 'bed'
  );
}
const DASH_KEY = 'Space';
// Set once this page has reported its visit, so that a remount doesn't count it twice.
let isVisitRecorded = false;
// The places under the open sky, where the weather falls and the night darkens the world.
const OUTSIDE: ReadonlySet<SidePlaceId> = new Set(['town', 'park', 'downtown']);
// How long the screen stays dark for a night's sleep, and the morning takes to come back.
const NIGHT_MILLISECONDS = 1800;
const WAKING_MILLISECONDS = 1600;

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
  const [interaction, setInteraction] = useState<Interaction | null>(null);
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
  const [sleep, setSleep] = useState<'asleep' | 'waking' | null>(null);
  // Where the character is, for the bus map to know which stop it is read at.
  const [place, setPlace] = useState<SidePlaceId>(progress.spot?.place ?? 'bedroom');
  // Where the character stands, kept by the scene, for saving it when the page is left.
  const spot = useRef<PlayerSpot | null>(progress.spot);
  const [highScore, setHighScore] = useState(progress.basketballHighScore);
  const [basketballRewardedOn, setBasketballRewardedOn] = useState(progress.basketballRewardedOn);
  const [binders, setBinders] = useState(progress.binders);
  const isTalking = talkingTo !== null;
  const [wallet, setWallet] = useState(progress.wallet);
  const [opening, setOpening] = useState<Opening | null>(null);
  // Held back until the opening closes, so that the counters move in front of the player, and so
  // that the coins don't give away a duplicate before the cards are shown.
  const walletAfterOpening = useRef<Wallet | null>(null);
  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // The "What's new?" sheet, with the notes it tells besides the pinned ones.
  const [newsShown, setNewsShown] = useState<readonly NewsItem[] | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isCouponRegisterOpen, setIsCouponRegisterOpen] = useState(false);
  const [activity, setActivity] = useState(progress.activity);
  const [collection, setCollection] = useState(progress.collection);
  const { isSaving, showSaveNotice } = useSaveNotice();
  const locale = useLocale();
  const tBooster = useTranslations('Booster');
  const tSettings = useTranslations('Settings');
  const tActivity = useTranslations('Activity');
  const tSpeakers = useTranslations('Speakers');
  const tShopkeeper = useTranslations('Shopkeeper');
  const tStones = useTranslations('Stones');
  const tGarden = useTranslations('Garden');
  const tTown = useTranslations('Town');
  const tHails = useTranslations('Hails');
  const tBus = useTranslations('Bus');
  const tQuest = useTranslations('Quest');
  // Beaten for the day, Papy Caillou only shares a saying: there is nothing to talk about.
  // Papy's memory game, won for the day, as the day's activity says: read again from the server
  // whenever a dialog closes, so that it never drifts from the database.
  const isMemoryWon = activity.done.includes('grandpa');
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
  const isCutting = useRef(false);
  const controls = useRef({ interaction, isDialogOpen, goToBed: () => {} });
  controls.current = { interaction, isDialogOpen, goToBed: () => goToBed() };

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const update = () => {
      input.current.keyboard = keyboardDirection(pressedKeys);
    };
    const releaseKeys = () => {
      pressedKeys.clear();
      update();
    };
    // A button reached with the keyboard keeps Space, but one that was only clicked doesn't. The
    // browser's own :focus-visible can't tell, since it turns on as soon as a key is pressed.
    let lastUsedPointer = false;
    const onPointerDown = () => {
      lastUsedPointer = true;
    };
    const isPressingAButton = () =>
      !lastUsedPointer && document.activeElement?.tagName === 'BUTTON';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Tab') {
        lastUsedPointer = false;
      }
      // While a dialog is open, the keys belong to it.
      if (controls.current.isDialogOpen) {
        return;
      }
      if (event.code === INTERACT_KEY && controls.current.interaction) {
        event.preventDefault();
        releaseKeys();
        if (controls.current.interaction === 'binder') {
          setIsBinderOpen(true);
        } else if (isDoorInteraction(controls.current.interaction)) {
          input.current.wantsDoor = true;
        } else if (controls.current.interaction === 'basketball') {
          setIsPlayingBasketball(true);
        } else if (controls.current.interaction === 'scrub') {
          input.current.wantsScrub = true;
        } else if (controls.current.interaction === 'busStop') {
          setIsBusMapOpen(true);
        } else if (controls.current.interaction === 'elevator') {
          setIsElevatorOpen(true);
        } else if (controls.current.interaction === 'bed') {
          controls.current.goToBed();
        } else {
          setTalkingTo(controls.current.interaction);
        }
      } else if (event.code === DASH_KEY && !isPressingAButton()) {
        event.preventDefault();
        if (!event.repeat) {
          input.current.wantsDash = true;
        }
      } else if (isMovementKey(event.code)) {
        event.preventDefault();
        // Walking away from a menu button gives Space back to the dash.
        (document.activeElement as HTMLElement | null)?.blur();
        pressedKeys.add(event.code);
        update();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.code);
      update();
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    // A key released in another window never sends keyup here.
    window.addEventListener('blur', releaseKeys);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseKeys);
    };
  }, []);

  // On arrival, the sheet tells what changed since the last note this browser showed. Kept in the
  // browser only: another device, or cleared site data, shows the recent notes again.
  useEffect(() => {
    try {
      const unread = unreadNews(parseLastSeenId(localStorage.getItem(NEWS_SEEN_KEY)));
      if (unread.length > 0) {
        setNewsShown(unread);
      }
    } catch {
      // No storage, such as in a private window: the sheet stays in the settings.
    }
  }, []);

  const closeNews = () => {
    setNewsShown(null);
    try {
      localStorage.setItem(NEWS_SEEN_KEY, String(latestNewsId()));
    } catch {
      // Without storage, the next visit tells the news again.
    }
  };

  const stopWalking = () => {
    input.current.keyboard = STILL;
    input.current.joystick = STILL;
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
    } else if (interaction) {
      setTalkingTo(interaction);
    }
  };

  const openBinder = () => {
    stopWalking();
    setIsBinderOpen(true);
  };

  const pickBooster = (setId: SetId) => {
    const set = sets.find(({ id }) => id === setId);
    if (!set) {
      return;
    }
    stopWalking();
    setIsBagOpen(false);
    setOpening({ status: 'sealed', setId, setName: set.name, logoUrl: set.logoUrl });
  };

  // The server takes the booster and keeps the cards. This only shows the result. One request at
  // a time: a second cut while the first is on its way would open another booster, and its
  // refusal, once the bag is empty, would hide the cards the first one drew.
  const cutBooster = async () => {
    if (!opening || isCutting.current) {
      return;
    }
    isCutting.current = true;
    const pack = { setId: opening.setId, setName: opening.setName, logoUrl: opening.logoUrl };
    setOpening({ status: 'cutting', ...pack });

    try {
      const response = await fetch(`/api/boosters/open?locale=${locale}&set=${pack.setId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { cards, isGodPack, wallet: updated } = await response.json();
      walletAfterOpening.current = updated;
      setCollection((current) => addToCollection(current, cards));
      setOpening({ status: 'ready', ...pack, cards, isGodPack });
      showSaveNotice();
    } catch {
      setOpening({ status: 'error', ...pack });
    } finally {
      isCutting.current = false;
    }
  };

  // Backing out of a sealed pack returns to the bag, to pick another one.
  const closeOpening = () => {
    if (opening?.status === 'sealed') {
      reportPlay({ type: 'booster.abandoned', setId: opening.setId });
      setIsBagOpen(true);
    }
    setOpening(null);
    if (walletAfterOpening.current) {
      setWallet(walletAfterOpening.current);
      walletAfterOpening.current = null;
    }
  };

  const buy = async (setId: SetId, quantity: number): Promise<ShopkeeperLine> => {
    try {
      const response = await fetch(`/api/shop/buy?set=${setId}&quantity=${quantity}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { wallet: updated, line } = await response.json();
      setWallet(updated);
      // A refused purchase changes nothing.
      if (line === 'thanks') {
        showSaveNotice();
      }
      return line;
    } catch {
      return 'unavailable';
    }
  };

  const buyBinder = async (setId: SetId): Promise<ShopkeeperLine> => {
    try {
      const response = await fetch(`/api/binders/buy?set=${setId}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { wallet: updated, binders: bought, line } = await response.json();
      setWallet(updated);
      setBinders(bought);
      if (line === 'thanks') {
        showSaveNotice();
      }
      return line;
    } catch {
      return 'unavailable';
    }
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

  // Each opening of the page is a visit, for the statistics: once per page, even if this component
  // mounts twice, with the kind of device and where the tab first came from.
  useEffect(() => {
    if (isVisitRecorded) {
      return;
    }
    isVisitRecorded = true;
    let referrer = document.referrer;
    try {
      referrer = sessionStorage.getItem(LANDING_REFERRER_KEY) || referrer;
      // Once counted, a reload of the game is no longer a visit from that link.
      sessionStorage.setItem(LANDING_REFERRER_KEY, '');
    } catch {
      // Without storage, the page's own referrer will do.
    }
    const device = window.matchMedia('(pointer: coarse)').matches ? 'phone' : 'desktop';
    fetch('/api/player/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, device, referrer }),
    }).catch(() => {});
  }, [locale]);

  // Each conversation that starts, for the statistics. Papy's skipping stones carry on his.
  useEffect(() => {
    if (talkingTo !== null && talkingTo !== 'grandpaStones') {
      reportPlay({ type: 'npc.talked', speaker: talkingTo });
    }
  }, [talkingTo]);

  // Leaving the page saves where the character stands and closes the visit, by beacons that
  // outlive the page.
  useEffect(() => {
    const saveOnLeave = () => {
      navigator.sendBeacon('/api/player/visit/end');
      if (spot.current) {
        navigator.sendBeacon(
          '/api/player/spot',
          new Blob([JSON.stringify(spot.current)], { type: 'application/json' }),
        );
      }
    };
    window.addEventListener('pagehide', saveOnLeave);
    return () => window.removeEventListener('pagehide', saveOnLeave);
  }, []);

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

  // At night, Pip sleeps until the morning: the server moves the clock on, while the screen goes
  // dark for a moment. By day, he isn't sleepy and the bed does nothing.
  const goToBed = async () => {
    if (!clock?.canSleep || sleep !== null) {
      return;
    }
    stopWalking();
    setSleep('asleep');
    const fellAsleep = Date.now();
    let slept: number | null = null;
    try {
      const response = await fetch('/api/player/sleep', { method: 'POST' });
      if (response.ok) {
        const { clockOffset: offset } = (await response.json()) as { clockOffset: unknown };
        slept = isValidOffset(offset) ? offset : null;
      }
    } catch {
      // The night is simply cut short.
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, NIGHT_MILLISECONDS - (Date.now() - fellAsleep))),
    );
    if (slept === null) {
      setSleep(null);
      return;
    }
    setClockOffset(slept);
    setSleep('waking');
    await new Promise((resolve) => setTimeout(resolve, WAKING_MILLISECONDS));
    setSleep(null);
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
        <div className="absolute inset-x-4 top-5 flex items-start justify-between gap-3 font-game text-ui-ink">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <p className="ui-tape max-w-44 -rotate-2 truncate ui-scrap px-3 pt-1.5 pb-1 font-display text-lg">
              {player.username}
            </p>
            <p className="relative flex rotate-1 items-center gap-1.5 ui-scrap px-3 py-1 font-digits text-base font-bold">
              <CoinIcon />
              <AnimatedCount value={wallet.coins} format={(count) => t('coins', { count })} />
            </p>
            <button
              type="button"
              disabled={boosterTotal === 0}
              aria-label={`${t('boosters', { count: boosterTotal })}. ${tBooster('title')}`}
              onClick={openBag}
              className="relative flex -rotate-1 items-center gap-1.5 ui-paper-button bg-ui-paper px-3 py-1 font-digits text-base font-bold enabled:cursor-pointer enabled:bg-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BoosterIcon />
              <AnimatedCount value={boosterTotal} format={(count) => t('boosters', { count })} />
            </button>
            <button
              type="button"
              onClick={openBinder}
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
              onClick={openSettings}
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
              aria-label={tActivity('open', {
                done: Math.min(activity.done.length, DAILY_QUEST_GOAL),
                total: DAILY_QUEST_GOAL,
              })}
              onClick={openActivity}
              className="relative flex -rotate-1 cursor-pointer items-center gap-1.5 ui-paper-button bg-ui-paper px-3 py-1 font-digits text-base font-bold"
            >
              <ActivityIcon />
              {/* Quests past the bonus's six are extra, so the count stops there. */}
              {Math.min(activity.done.length, DAILY_QUEST_GOAL)}/{DAILY_QUEST_GOAL}
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
        {isPapySaying && !isDialogOpen && (
          // Papy Caillou's saying, in his speech bubble, once his memory game is won for the day.
          // Pressing it, or the interact key, still talks to him, for his skipping stones.
          <button
            ref={bubble as RefObject<HTMLButtonElement | null>}
            type="button"
            aria-live="polite"
            onClick={interact}
            style={{ transform: 'translate(-200vw, 0)' }}
            className="group absolute top-0 left-0 cursor-pointer pb-2.5 font-game text-ui-ink"
          >
            <span className="ui-pop-in block w-max max-w-[min(22rem,80vw)] rounded-[2rem] bg-ui-paper px-6 py-3 text-center shadow-[3px_4px_0_var(--ui-shadow)]">
              <span className="block text-lg leading-snug">
                « {tQuest(`grandpa.proverbs.${proverb}.text` as 'grandpa.proverbs.1.text')} »
              </span>
              <span className="mt-1 block text-sm text-ui-ink/60">
                {tQuest(`grandpa.proverbs.${proverb}.source` as 'grandpa.proverbs.1.source')}
              </span>
              <span className="mt-1.5 flex items-center justify-center gap-2 text-base">
                <kbd className="rounded-full bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
                  E
                </kbd>
                {t('grandpa')}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-1/2 h-4 w-3 -translate-x-1/2 bg-ui-paper [clip-path:polygon(0_0,100%_0,30%_100%)]"
            />
          </button>
        )}
        {interaction && !isDialogOpen && !isPapySaying && isTalk(interaction) && (
          // A speech bubble that the scene moves just above the head of who the player can talk to.
          <button
            ref={bubble as RefObject<HTMLButtonElement | null>}
            type="button"
            aria-label={t(interaction)}
            onClick={interact}
            style={{ transform: 'translate(-200vw, 0)' }}
            className="group absolute top-0 left-0 cursor-pointer pb-2.5 font-game text-xl text-ui-ink"
          >
            <span className="ui-pop-in flex items-center gap-2 rounded-[50%] bg-ui-paper px-9 py-3 shadow-[3px_4px_0_var(--ui-shadow)] transition-transform group-hover:-translate-y-0.5">
              <kbd className="rounded-full bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
                E
              </kbd>
              {/* What the character says, while the button's name says what pressing it does. */}
              <span aria-hidden="true">{tHails(interaction, { name: player.username })}</span>
            </span>
            {/* The bubble's tail, pointing down at the speaker. */}
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-1/2 h-4 w-3 -translate-x-1/2 bg-ui-paper [clip-path:polygon(0_0,100%_0,30%_100%)]"
            />
          </button>
        )}
        {/* The game's version, tucked in a corner so that testers can say which one they play. */}
        <p className="pointer-events-none absolute bottom-1 left-2 font-digits text-[0.65rem] text-ui-ink/45 select-none">
          {t('version', { version: process.env.APP_VERSION ?? '' })}
        </p>
        {interaction && !isDialogOpen && !isTalk(interaction) && (
          <button
            type="button"
            onClick={interact}
            aria-disabled={interaction === 'bed' && !clock?.canSleep}
            className="ui-bob absolute inset-x-0 bottom-16 mx-auto flex w-fit cursor-pointer items-center gap-2 ui-paper-button bg-ui-paper py-1 pr-4 pl-1.5 font-game text-xl text-ui-ink"
          >
            <kbd className="ui-scrap bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
              E
            </kbd>
            {interaction === 'bed' && !clock?.canSleep ? t('notSleepy') : t(interaction)}
          </button>
        )}
        {!isTalking &&
          memoryCards === null &&
          !isFishing &&
          !isPlayingBasketball &&
          dalgonaShape === null &&
          !isRaffling && (
            <>
              <p className="pointer-events-none absolute inset-x-0 bottom-4 px-4 text-center text-sm opacity-70 pointer-coarse:hidden">
                {t('keyboardHint')}
              </p>
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
              setNewsShown(NEWS);
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
          talkingTo === 'grandpaStones') && (
          <ShiftDialog
            host={talkingTo === 'grandpaStones' ? 'grandpa' : talkingTo}
            startJob={talkingTo === 'grandpaStones' ? 'stones' : undefined}
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
          talkingTo !== 'trotte' &&
          talkingTo !== 'ramenChef' &&
          talkingTo !== 'dojoMaster' &&
          talkingTo !== 'gardener' &&
          talkingTo !== 'grandpaStones' && (
            <ShopDialog
              stock={talkingTo}
              items={(talkingTo === 'binderSeller'
                ? bindersForSale(sets)
                : setsSoldBy(talkingTo, sets)
              ).map((set) => {
                const hasBinder = binders.includes(set.id);
                return {
                  set,
                  refusal:
                    talkingTo === 'binderSeller'
                      ? hasBinder
                        ? 'alreadyOwned'
                        : null
                      : hasBinder
                        ? null
                        : 'needsBinder',
                  inBag: boosterCount(wallet, set.id),
                };
              })}
              coins={wallet.coins}
              onBuy={talkingTo === 'binderSeller' ? buyBinder : buy}
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
        {/* A night's sleep: the screen goes dark, then the morning comes back. */}
        <div
          role="status"
          className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-[#141b33] font-display text-3xl text-ui-paper transition-opacity duration-700 ${
            sleep === 'asleep' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {sleep === 'asleep' && t('sleeping', { name: player.username })}
          {sleep === 'waking' && <span className="sr-only">{t('wakingUp')}</span>}
        </div>
      </div>
    </PlayerNameContext>
  );
}
