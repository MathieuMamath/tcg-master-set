import { type Dispatch, type SetStateAction, useRef, useState } from 'react';
import { addToCollection, type Collection } from '@/game/cards/binder';
import type { BoosterLotSize } from '@/game/cards/booster-lots';
import type { PlayableSet, SetId } from '@/game/cards/card-sets';
import type { Wallet } from '@/game/cards/shop-dialogue';
import type { OpenedBoosters } from '@/player/shop';
import { reportPlay } from '../report';
import type { Opening } from './booster-opening';

type Options = {
  sets: readonly PlayableSet[];
  locale: string;
  stopWalking: () => void;
  setIsBagOpen: (isOpen: boolean) => void;
  setWallet: (wallet: Wallet) => void;
  setCollection: Dispatch<SetStateAction<Collection>>;
  showSaveNotice: () => void;
};

// A booster, or a lot of five or ten, taken out of the bag, cut, and shown: card by card for one,
// all together for a lot.
export function useBoosterOpening({
  sets,
  locale,
  stopWalking,
  setIsBagOpen,
  setWallet,
  setCollection,
  showSaveNotice,
}: Options) {
  const [opening, setOpening] = useState<Opening | null>(null);
  // Held back until the opening closes, so that the counters move in front of the player, and so
  // that the coins don't give away a duplicate before the cards are shown.
  const walletAfterOpening = useRef<Wallet | null>(null);
  const isCutting = useRef(false);

  const pickBooster = (setId: SetId, size: BoosterLotSize) => {
    const set = sets.find(({ id }) => id === setId);
    if (!set) {
      return;
    }
    stopWalking();
    setIsBagOpen(false);
    setOpening({ status: 'sealed', setId, setName: set.name, logoUrl: set.logoUrl, size });
  };

  // The server takes the booster and keeps the cards. This only shows the result. One request at
  // a time: a second cut while the first is on its way would open another booster, and its
  // refusal, once the bag is empty, would hide the cards the first one drew.
  const cutBooster = async () => {
    if (!opening || isCutting.current) {
      return;
    }
    isCutting.current = true;
    const pack = {
      setId: opening.setId,
      setName: opening.setName,
      logoUrl: opening.logoUrl,
      size: opening.size,
    };
    setOpening({ status: 'cutting', ...pack });

    try {
      const response = await fetch(
        `/api/boosters/open?locale=${locale}&set=${pack.setId}&count=${pack.size}`,
        { method: 'POST' },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { packs, wallet: updated }: OpenedBoosters = await response.json();
      walletAfterOpening.current = updated;
      setCollection((current) =>
        addToCollection(
          current,
          packs.flatMap(({ cards }) => cards),
        ),
      );
      setOpening({ status: 'ready', ...pack, packs });
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

  return { opening, pickBooster, cutBooster, closeOpening };
}
