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
import { QuestBanner } from './quest-banner';
import { QuestDialog, type QuestLine } from './quest-dialog';
import { SaveNotice, useSaveNotice } from './save-notice';
import type { MovementInput } from './scene';
import { SettingsMenu } from './settings-menu';
import { ShopDialog } from './shop-dialog';

// Three.js needs the browser, and this keeps it out of the bundle of every other screen.
const Scene = dynamic(() => import('./scene').then((module) => module.Scene), { ssr: false });

const INTERACT_KEY = 'KeyE';
const DASH_KEY = 'Space';

type Props = {
  player: Player;
  sets: readonly PlayableSet[];
  progress: PlayerProgress;
};

export function Game({ player, sets, progress }: Props) {
  const t = useTranslations('Game');
  const input = useRef<MovementInput>({ keyboard: STILL, joystick: STILL, wantsDash: false });
  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [talkingTo, setTalkingTo] = useState<ShopkeeperStock | 'binderSeller' | QuestGiver | null>(
    null,
  );
  const [quest, setQuest] = useState<{ startedAt: number; stains: readonly Stain[] } | null>(null);
  const [questLine, setQuestLine] = useState<QuestLine>('greeting');
  const isFinishingQuest = useRef(false);
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
  const tQuest = useTranslations('Quest');
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
      }
      setQuestLine(isRewarded ? 'rewarded' : 'failed');
    } catch {
      setQuestLine('unavailable');
    }
    setTalkingTo('grandma');
  };

  // Called from the 3D scene's frames, where the same stain can be reported more than once before
  // the state updates. The last one must only finish the quest once.
  const cleanStain = (id: number) => {
    if (!quest || isFinishingQuest.current) {
      return;
    }
    const left = quest.stains.filter((stain) => stain.id !== id);
    if (left.length === 0) {
      isFinishingQuest.current = true;
      finishQuest();
    } else {
      setQuest({ ...quest, stains: left });
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

  // Stepping out of the apartment gives up on the quest, since the stains stay inside.
  const leavePlace = useCallback(() => {
    setQuest(null);
    setQuestLine('greeting');
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
      <Scene
        input={input}
        webglUnavailable={t('webglUnavailable')}
        onSave={showSaveNotice}
        stains={quest?.stains ?? []}
        onStainCleaned={cleanStain}
        onPlaceLeft={leavePlace}
        playerId={player.id}
        savedSpot={progress.spot}
        onInteractionChange={setInteraction}
        isTalking={isTalking}
        shopSigns={{
          latest: tShopkeeper('names.latest'),
          thisYear: tShopkeeper('names.thisYear'),
          older: tShopkeeper('names.older'),
          library: tShopkeeper('names.binderSeller'),
          grandma: tQuest('grandma.name'),
          park: tShopkeeper('names.park'),
          arcade: tShopkeeper('names.arcade'),
          basketball: tShopkeeper('names.basketball'),
        }}
      />
      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2 font-game text-sm font-semibold text-ui-ink">
        <div className="flex min-w-0 flex-wrap gap-2">
          <p className="max-w-40 truncate rounded-full border-3 border-ui-ink bg-ui-paper px-3 py-0.5">
            {player.username}
          </p>
          <p className="relative flex items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-1.5">
            <span
              aria-hidden="true"
              className="size-4 rounded-full border-2 border-ui-ink bg-ui-accent"
            />
            <AnimatedCount value={wallet.coins} format={(count) => t('coins', { count })} />
          </p>
          <button
            type="button"
            disabled={boosterTotal === 0}
            aria-label={`${t('boosters', { count: boosterTotal })}. ${tBooster('title')}`}
            onClick={openBag}
            className="relative flex items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-2 enabled:cursor-pointer enabled:bg-ui-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className="h-4 w-3 rounded-xs border-2 border-ui-ink bg-[#7b5ea7]"
            />
            <AnimatedCount value={boosterTotal} format={(count) => t('boosters', { count })} />
          </button>
          <button
            type="button"
            onClick={openBinder}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border-3 border-ui-ink bg-ui-paper py-0.5 pr-3 pl-2"
          >
            <span
              aria-hidden="true"
              className="h-4 w-3.5 rounded-xs border-2 border-l-4 border-ui-ink bg-[#2e86ab]"
            />
            {t('binderButton')}
          </button>
        </div>
        <button
          type="button"
          aria-label={tSettings('open')}
          onClick={openSettings}
          className="shrink-0 cursor-pointer rounded-full border-3 border-ui-ink bg-ui-paper p-1"
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
      {interaction && !isDialogOpen && (
        <button
          type="button"
          onClick={interact}
          className="ui-bob absolute inset-x-0 bottom-16 mx-auto flex w-fit cursor-pointer items-center gap-2 rounded-full border-4 border-ui-ink bg-ui-paper py-1 pr-4 pl-1.5 font-game text-lg font-semibold text-ui-ink shadow-[0_4px_0_var(--ui-ink)]"
        >
          <kbd className="rounded-full border-3 border-ui-ink bg-ui-accent px-2 font-game text-sm pointer-coarse:hidden">
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
