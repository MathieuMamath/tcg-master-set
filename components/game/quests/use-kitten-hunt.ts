import { type Dispatch, type RefObject, type SetStateAction, useEffect, useState } from 'react';
import type { Wallet } from '@/game/cards/shop-dialogue';
import type { DailyActivity } from '@/game/quests/activity';
import { type HidingSpotId, hidingSpotAlong } from '@/game/world/side-rooms';
import type { PlayerSpot } from '@/game/world/spot';
import type { Interaction } from '@/game/world/world';
import type { KittenSearch } from '@/player/quests/kitten';
import type { Talk } from '../talk';

type Options = {
  // Whether Mme Ronron gave her hint today, as the page loaded it.
  isHintGiven: boolean;
  activity: DailyActivity;
  talkingTo: Talk | null;
  // What the scene says the character can do where it stands.
  reached: Interaction | null;
  spot: RefObject<PlayerSpot | null>;
  stopWalking: () => void;
  setWallet: (wallet: Wallet) => void;
  setActivity: Dispatch<SetStateAction<DailyActivity>>;
  showSaveNotice: () => void;
};

// Mme Ronron's lost kitten: her hint of where he hides today, and the searches of the hiding places.
export function useKittenHunt({
  isHintGiven,
  activity,
  talkingTo,
  reached,
  spot,
  stopWalking,
  setWallet,
  setActivity,
  showSaveNotice,
}: Options) {
  // Where the kitten hides today, once she gave her hint, and what the last search found.
  const [kittenSpot, setKittenSpot] = useState<HidingSpotId | null>(null);
  const [isKittenHintGiven, setIsKittenHintGiven] = useState(isHintGiven);
  const [searchNote, setSearchNote] = useState<'nothing' | 'unavailable' | null>(null);
  const [isKittenFound, setIsKittenFound] = useState(false);
  const isFoundToday = activity.done.includes('ronronKitten');
  // The hiding places are only searched while the kitten is lost and Mme Ronron gave her hint.
  const isKittenHunted = isKittenHintGiven && !isFoundToday;

  // A hiding place searched: the server alone knows where the kitten is, and pays when found.
  const searchHere = async () => {
    const hidingSpot = spot.current && hidingSpotAlong(spot.current.place, spot.current.x);
    if (!hidingSpot) {
      return;
    }
    stopWalking();
    try {
      const response = await fetch('/api/quests/kitten/search', {
        method: 'POST',
        body: JSON.stringify({ spot: hidingSpot }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const found: KittenSearch = await response.json();
      if (!found.isFound) {
        setSearchNote('nothing');
        return;
      }
      setWallet(found.wallet);
      showSaveNotice();
      setActivity((current) =>
        current.done.includes('ronronKitten')
          ? current
          : { ...current, done: [...current.done, 'ronronKitten'] },
      );
      setIsKittenFound(true);
    } catch {
      setSearchNote('unavailable');
    }
  };

  // A search's note fades after a moment, or as soon as the character walks off.
  useEffect(() => {
    if (searchNote === null) {
      return;
    }
    const timer = setTimeout(() => setSearchNote(null), 2500);
    return () => clearTimeout(timer);
  }, [searchNote]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new place to stand clears the note.
  useEffect(() => setSearchNote(null), [reached]);

  // Talking to Mme Ronron while her kitten is lost gives her hint: the day's hiding place.
  useEffect(() => {
    if (talkingTo !== 'ronron' || kittenSpot !== null || activity.done.includes('ronronKitten')) {
      return;
    }
    fetch('/api/quests/kitten/start', { method: 'POST' })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((answer: { hasStarted: boolean; spot?: HidingSpotId }) => {
        if (answer.hasStarted && answer.spot) {
          setKittenSpot(answer.spot);
          setIsKittenHintGiven(true);
        }
      })
      .catch(() => {});
  }, [talkingTo, kittenSpot, activity.done]);

  return {
    kittenSpot,
    isKittenHunted,
    searchNote,
    isKittenFound,
    closeKittenFound: () => setIsKittenFound(false),
    searchHere,
  };
}
