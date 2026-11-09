import { useTranslations } from 'next-intl';
import type { PlayableSet, SetId } from '@/game/cards/card-sets';
import {
  bindersForSale,
  boosterCount,
  type ShopkeeperLine,
  type ShopkeeperStock,
  setsSoldBy,
  type Wallet,
} from '@/game/cards/shop-dialogue';
import { usePlayerName } from '../player-name';
import { ShopDialog } from './shop-dialog';

type Props = {
  stock: ShopkeeperStock | 'binderSeller';
  sets: readonly PlayableSet[];
  binders: readonly SetId[];
  wallet: Wallet;
  // Whether Mamie Noisette's quiz is done for the day, and how to start it.
  isQuizDone: boolean;
  onStartQuiz: () => void;
  onWallet: (wallet: Wallet) => void;
  onBinders: (binders: SetId[]) => void;
  showSaveNotice: () => void;
  onClose: () => void;
};

// A conversation with one of the sellers: the raccoon triplets, who sell boosters of the sets
// whose binder the player owns, or Mamie Noisette, who sells the binders and asks her quiz. The
// server makes every sale.
export function SellerConversation({
  stock,
  sets,
  binders,
  wallet,
  isQuizDone,
  onStartQuiz,
  onWallet,
  onBinders,
  showSaveNotice,
  onClose,
}: Props) {
  const tQuiz = useTranslations('Quiz');
  const playerName = usePlayerName();
  const isBinderSeller = stock === 'binderSeller';

  const buyBoosters = async (setId: SetId, quantity: number): Promise<ShopkeeperLine> => {
    try {
      const response = await fetch(`/api/shop/buy?set=${setId}&quantity=${quantity}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const { wallet: updated, line } = await response.json();
      onWallet(updated);
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
      onWallet(updated);
      onBinders(bought);
      if (line === 'thanks') {
        showSaveNotice();
      }
      return line;
    } catch {
      return 'unavailable';
    }
  };

  const items = (isBinderSeller ? bindersForSale(sets) : setsSoldBy(stock, sets)).map((set) => {
    const hasBinder = binders.includes(set.id);
    return {
      set,
      // A binder can only be bought once, and a set's boosters only once its binder is bought.
      refusal: isBinderSeller
        ? hasBinder
          ? ('alreadyOwned' as const)
          : null
        : hasBinder
          ? null
          : ('needsBinder' as const),
      inBag: boosterCount(wallet, set.id),
    };
  });

  return (
    <ShopDialog
      stock={stock}
      items={items}
      coins={wallet.coins}
      onBuy={isBinderSeller ? buyBinder : buyBoosters}
      extra={
        isBinderSeller
          ? {
              label: tQuiz('start'),
              // Mamie Noisette's quiz, once a day: done, she says so instead.
              doneLine: isQuizDone ? tQuiz('alreadyDone', { name: playerName }) : null,
              onPress: onStartQuiz,
            }
          : undefined
      }
      onClose={onClose}
    />
  );
}
