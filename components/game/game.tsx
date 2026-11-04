'use client';

import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from '@/auth/session';
import type { MemoryCard } from '@/cards/memory-cards';
import { addToCollection } from '@/game/binder';
import type { PlayableSet, SetId } from '@/game/card-sets';
import type { MemoryStatus } from '@/game/memory-game';
import { isMovementKey, keyboardDirection, STILL } from '@/game/movement';
import { pickStains, questDay, type Stain } from '@/game/quests';
import {
  BINDER_PRICE,
  BOOSTER_PRICE,
  bindersForSale,
  boosterCount,
  type ShopkeeperLine,
  type ShopkeeperStock,
  setsSoldBy,
  totalBoosters,
  type Wallet,
} from '@/game/shop-dialogue';
import { isDoorInteraction } from '@/game/side-rooms';
import type { Interaction, QuestGiver } from '@/game/world';
import type { BasketballResult, FishingCatch, PlayerProgress } from '@/player/progress';
import { AnimatedCount } from './animated-count';
import { BasketballDialog } from './basketball-dialog';
import { BinderView } from './binder-view';
import { BoosterBag } from './booster-bag';
import { BoosterOpening, type Opening } from './booster-opening';
import { FishingDialog } from './fishing-dialog';
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
    !isDoorInteraction(interaction) && interaction !== 'binder' && interaction !== 'basketball'
  );
}
const DASH_KEY = 'Space';

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
  const [isFishing, setIsFishing] = useState(false);
  const [boyLine, setBoyLine] = useState<QuestLine>('greeting');
  const [isPlayingBasketball, setIsPlayingBasketball] = useState(false);
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
  const isDialogOpen =
    isTalking ||
    isBinderOpen ||
    isBagOpen ||
    isSettingsOpen ||
    opening !== null ||
    memoryCards !== null ||
    isFishing ||
    isPlayingBasketball;
  const ownedBoosters = sets
    .map((set) => ({ ...set, count: boosterCount(wallet, set.id) }))
    .filter(({ count }) => count > 0);
  const boosterTotal = totalBoosters(wallet);
  const bubble = useRef<HTMLButtonElement>(null);
  const controls = useRef({ interaction, isDialogOpen });
  controls.current = { interaction, isDialogOpen };

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

  const buy = async (setId: SetId): Promise<ShopkeeperLine> => {
    try {
      const response = await fetch(`/api/shop/buy?set=${setId}`, { method: 'POST' });
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
      setQuest({ startedAt: Date.now(), stains: pickStains() });
      setQuestLine('hurry');
      return null;
    } catch {
      return 'unavailable';
    }
  };

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

  // The server draws the fish and pays for it. This only shows the result.
  const reelIn = async (): Promise<FishingCatch | null> => {
    try {
      const response = await fetch('/api/quests/fishing/catch', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const caught: FishingCatch = await response.json();
      if (caught.fish) {
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
          latest: tShopkeeper('names.latest'),
          thisYear: tShopkeeper('names.thisYear'),
          older: tShopkeeper('names.older'),
        }}
        onInteractionChange={setInteraction}
      />
      <div className="absolute inset-x-4 top-5 flex items-start justify-between gap-3 font-game text-ui-ink">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <p className="ui-tape max-w-44 -rotate-2 truncate ui-scrap px-3 pt-1.5 pb-1 font-display text-lg">
            {player.username}
          </p>
          <p className="relative flex rotate-1 items-center gap-1.5 ui-scrap px-3 py-1 font-digits text-base font-bold">
            <span
              aria-hidden="true"
              className="size-3.5 rounded-full border-2 border-ui-accent-dark bg-ui-accent"
            />
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
            <span
              aria-hidden="true"
              className="h-4 w-3.5 rounded-xs border-l-4 border-ui-ink/60 bg-[#e6ece8]"
            />
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
      {interaction && !isDialogOpen && isTalk(interaction) && (
        // A speech bubble that the scene moves just above the head of who the player can talk to.
        <button
          ref={bubble}
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
          choices={
            talkingTo === 'binderSeller'
              ? bindersForSale(sets).map(({ id, name }) => {
                  const isOwned = binders.includes(id);
                  return {
                    setId: id,
                    label: isOwned
                      ? tShopkeeper('binderOwned', { set: name })
                      : tShopkeeper('buyBinder', { set: name, price: BINDER_PRICE }),
                    isUnavailable: isOwned,
                  };
                })
              : setsSoldBy(talkingTo, sets, new Date().getFullYear()).map(({ id, name }) => ({
                  setId: id,
                  label: binders.includes(id)
                    ? tShopkeeper('buy', { set: name, price: BOOSTER_PRICE })
                    : tShopkeeper('buyNeedsBinder', { set: name }),
                }))
          }
          onBuy={talkingTo === 'binderSeller' ? buyBinder : buy}
          onClose={() => setTalkingTo(null)}
        />
      )}
      <SaveNotice isSaving={isSaving} />
    </div>
  );
}

// A small booster like the ones in the bag: crimped at both ends, striped, with a star.
function BoosterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 22" className="h-5.5 w-4 shrink-0 -rotate-6">
      <defs>
        <linearGradient id="booster-icon-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5e4ba8" />
          <stop offset="0.5" stopColor="#3c8fb4" />
          <stop offset="1" stopColor="#7e63be" />
        </linearGradient>
        <clipPath id="booster-icon-outline">
          <path d="M0 1.5 2 0 4 1.5 6 0 8 1.5 10 0 12 1.5 14 0 16 1.5V20.5L14 22 12 20.5 10 22 8 20.5 6 22 4 20.5 2 22 0 20.5Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#booster-icon-outline)">
        <rect width="16" height="22" fill="url(#booster-icon-paper)" />
        <path
          d="M-4 22 8 4M2 26 18 2M10 26 22 8"
          stroke="#fff"
          strokeOpacity="0.2"
          strokeWidth="2.5"
        />
        <rect width="16" height="3.5" fill="#000" fillOpacity="0.25" />
        <rect y="18.5" width="16" height="3.5" fill="#000" fillOpacity="0.25" />
      </g>
      <path
        d="M8 6.8 9.2 9.4 12 9.7 9.9 11.6 10.5 14.4 8 13 5.5 14.4 6.1 11.6 4 9.7 6.8 9.4Z"
        fill="var(--ui-accent)"
        stroke="var(--ui-paper)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
