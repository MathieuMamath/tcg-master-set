'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from '@/auth/session';
import type { MemoryCard } from '@/cards/memory-cards';
import { addToCollection } from '@/game/binder';
import { stopAt } from '@/game/bus';
import type { PlayableSet, SetId } from '@/game/card-sets';
import type { MemoryStatus } from '@/game/memory-game';
import { isMovementKey, keyboardDirection, STILL } from '@/game/movement';
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
import { isDoorInteraction, type SidePlaceId } from '@/game/side-rooms';
import type { PlayerSpot } from '@/game/spot';
import type { Interaction, QuestGiver } from '@/game/world';
import type { BasketballResult, FishingCatch, PlayerProgress } from '@/player/progress';
import { AnimatedCount } from './animated-count';
import { BasketballDialog } from './basketball-dialog';
import { BinderView } from './binder-view';
import { BoosterBag } from './booster-bag';
import { BoosterOpening, type Opening } from './booster-opening';
import { BusMap } from './bus-map';
import { FishingDialog } from './fishing-dialog';
import { BinderIcon, BoosterIcon, CoinIcon } from './hud-icons';
import { Joystick } from './joystick';
import { MemoryDialog } from './memory-dialog';
import type { MovementInput } from './paper-scene';
import { QuestBanner } from './quest-banner';
import { QuestDialog, type QuestLine } from './quest-dialog';
import { SaveNotice, useSaveNotice } from './save-notice';
import { SettingsMenu } from './settings-menu';
import { ShopDialog } from './shop-dialog';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const PaperScene = dynamic(() => import('./paper-scene').then((module) => module.PaperScene), {
  ssr: false,
});

const INTERACT_KEY = 'KeyE';

type Talk = ShopkeeperStock | 'binderSeller' | QuestGiver;

// Talking to someone gets a speech bubble over their head, and everything else a prompt at the
// bottom of the screen.
function isTalk(interaction: Interaction): interaction is Talk {
  return (
    !isDoorInteraction(interaction) &&
    interaction !== 'binder' &&
    interaction !== 'basketball' &&
    interaction !== 'scrub' &&
    interaction !== 'busStop'
  );
}
const DASH_KEY = 'Space';

// Where the character stands gives no advantage, so a save that fails is simply let go.
function saveSpot(spot: PlayerSpot) {
  fetch('/api/player/spot', {
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
  const [talkingTo, setTalkingTo] = useState<ShopkeeperStock | 'binderSeller' | QuestGiver | null>(
    null,
  );
  const [quest, setQuest] = useState<{ startedAt: number; stains: readonly Stain[] } | null>(null);
  const [questLine, setQuestLine] = useState<QuestLine>('greeting');
  const [memoryCards, setMemoryCards] = useState<readonly MemoryCard[] | null>(null);
  const [grandpaLine, setGrandpaLine] = useState<QuestLine>('greeting');
  const [memoryWonOn, setMemoryWonOn] = useState(progress.memoryWonOn);
  // The saying Papy Caillou shares once beaten, picked anew at each visit to the park.
  const [proverb, setProverb] = useState(() => pickProverb());
  const [isFishing, setIsFishing] = useState(false);
  const [boyLine, setBoyLine] = useState<QuestLine>('greeting');
  const [isPlayingBasketball, setIsPlayingBasketball] = useState(false);
  const [isBusMapOpen, setIsBusMapOpen] = useState(false);
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
  const [collection, setCollection] = useState(progress.collection);
  const { isSaving, showSaveNotice } = useSaveNotice();
  const locale = useLocale();
  const tBooster = useTranslations('Booster');
  const tSettings = useTranslations('Settings');
  const tShopkeeper = useTranslations('Shopkeeper');
  const tTown = useTranslations('Town');
  const tHails = useTranslations('Hails');
  const tBus = useTranslations('Bus');
  const tQuest = useTranslations('Quest');
  // Beaten for the day, Papy Caillou only shares a saying: there is nothing to talk about.
  const isPapySaying = interaction === 'grandpa' && memoryWonOn === questDay(new Date());
  const isDialogOpen =
    isTalking ||
    isBinderOpen ||
    isBagOpen ||
    isSettingsOpen ||
    opening !== null ||
    memoryCards !== null ||
    isFishing ||
    isPlayingBasketball ||
    isBusMapOpen;
  const ownedBoosters = sets
    .map((set) => ({ ...set, count: boosterCount(wallet, set.id) }))
    .filter(({ count }) => count > 0);
  const boosterTotal = totalBoosters(wallet);
  const bubble = useRef<HTMLElement>(null);
  const isFinishingQuest = useRef(false);
  const controls = useRef({ interaction, isDialogOpen, isPapySaying });
  controls.current = { interaction, isDialogOpen, isPapySaying };

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
      if (
        event.code === INTERACT_KEY &&
        controls.current.interaction &&
        !controls.current.isPapySaying
      ) {
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

  // The server takes the booster and keeps the cards. This only shows the result.
  const cutBooster = async () => {
    if (!opening) {
      return;
    }
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
    }
  };

  // Backing out of a sealed pack returns to the bag, to pick another one.
  const closeOpening = () => {
    if (opening?.status === 'sealed') {
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

  // Leaving the page saves where the character stands, by a beacon that outlives the page.
  useEffect(() => {
    const saveOnLeave = () => {
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
  const changePlace = useCallback((arrived: PlayerSpot) => {
    const next = arrived.place;
    saveSpot(arrived);
    setPlace(next);
    if (next === 'park') {
      setProverb((previous) => nextProverb(previous));
    }
    if (next !== 'flat') {
      setQuest(null);
      setQuestLine((line) => (line === 'hurry' ? 'greeting' : line));
    }
  }, []);

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
      setMemoryWonOn(questDay(new Date()));
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

  const openSettings = () => {
    stopWalking();
    setIsSettingsOpen(true);
  };

  return (
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
          latest: tShopkeeper('names.latest'),
          thisYear: tShopkeeper('names.thisYear'),
          older: tShopkeeper('names.older'),
        }}
        stains={quest?.stains ?? []}
        onInteractionChange={setInteraction}
        onScrub={scrub}
        startSpot={progress.spot}
        spot={spot}
        onPlaceChange={changePlace}
      />
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
      </div>
      {isPapySaying && !isDialogOpen && (
        // Papy Caillou's saying, in his speech bubble: something to read, not to press.
        <p
          ref={bubble as RefObject<HTMLParagraphElement | null>}
          aria-live="polite"
          style={{ transform: 'translate(-200vw, 0)' }}
          className="pointer-events-none absolute top-0 left-0 pb-2.5 font-game text-ui-ink"
        >
          <span className="ui-pop-in block w-max max-w-[min(22rem,80vw)] rounded-[2rem] bg-ui-paper px-6 py-3 text-center shadow-[3px_4px_0_var(--ui-shadow)]">
            <span className="block text-lg leading-snug">
              « {tQuest(`grandpa.proverbs.${proverb}.text` as 'grandpa.proverbs.1.text')} »
            </span>
            <span className="mt-1 block text-sm text-ui-ink/60">
              {tQuest(`grandpa.proverbs.${proverb}.source` as 'grandpa.proverbs.1.source')}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 left-1/2 h-4 w-3 -translate-x-1/2 bg-ui-paper [clip-path:polygon(0_0,100%_0,30%_100%)]"
          />
        </p>
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
            <span aria-hidden="true">{tHails(interaction)}</span>
          </span>
          {/* The bubble's tail, pointing down at the speaker. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 left-1/2 h-4 w-3 -translate-x-1/2 bg-ui-paper [clip-path:polygon(0_0,100%_0,30%_100%)]"
          />
        </button>
      )}
      {interaction && !isDialogOpen && !isTalk(interaction) && (
        <button
          type="button"
          onClick={interact}
          className="ui-bob absolute inset-x-0 bottom-16 mx-auto flex w-fit cursor-pointer items-center gap-2 ui-paper-button bg-ui-paper py-1 pr-4 pl-1.5 font-game text-xl text-ui-ink"
        >
          <kbd className="ui-scrap bg-ui-accent px-2 font-digits text-sm font-bold pointer-coarse:hidden">
            E
          </kbd>
          {t(interaction)}
        </button>
      )}
      {!isTalking && memoryCards === null && !isFishing && !isPlayingBasketball && (
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
          onPick={pickBooster}
          onClose={() => setIsBagOpen(false)}
        />
      )}
      {isSettingsOpen && <SettingsMenu onClose={() => setIsSettingsOpen(false)} />}
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
          line={grandpaLine}
          onAccept={startMemoryGame}
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
      {talkingTo && talkingTo !== 'grandma' && talkingTo !== 'grandpa' && talkingTo !== 'boy' && (
        <ShopDialog
          stock={talkingTo}
          items={(talkingTo === 'binderSeller'
            ? bindersForSale(sets)
            : setsSoldBy(talkingTo, sets, new Date().getFullYear())
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
    </div>
  );
}
