// The look the player walks about as: the animal, from the mirror in the bedroom, and the items
// worn in each slot, bought at the boutique downtown.

import { and, eq, gte, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { playerAvatars, playerItems, playerWallets } from '@/db/schema';
import {
  type BoutiqueLine,
  type GearId,
  type HatId,
  ITEMS,
  type ItemId,
  type ItemSlot,
  isItemId,
  isStarterItem,
  ownsItem,
  type ScarfId,
  STARTER_LOOK,
  type WornItems,
} from '@/game/avatar/items';
import { type AvatarSpecies, DEFAULT_SPECIES, isAvatarSpecies } from '@/game/avatar/species';
import type { Wallet } from '@/game/cards/shop-dialogue';
import { recordEvent } from './events';
import { coinsNow, loadWallet, type Reader } from './wallet';

export type Look = WornItems & { species: AvatarSpecies; ownedItems: ItemId[] };

export async function loadLook(database: Reader, userId: string): Promise<Look> {
  const [row] = await database
    .select({
      species: playerAvatars.species,
      scarf: playerAvatars.scarf,
      hat: playerAvatars.hat,
      gear: playerAvatars.gear,
    })
    .from(playerAvatars)
    .where(eq(playerAvatars.userId, userId));
  const ownedItems = await loadOwnedItems(database, userId);
  // What is worn in a slot, as long as the game still has it, in that slot, and the player has it;
  // otherwise what everyone starts with.
  const worn = <Slot extends ItemSlot>(slot: Slot, value: string | null | undefined) => {
    if (!row) {
      return STARTER_LOOK[slot];
    }
    if (value === null) {
      return null;
    }
    return value !== undefined &&
      isItemId(value) &&
      ITEMS[value].slot === slot &&
      ownsItem(ownedItems, value)
      ? (value as WornItems[Slot])
      : STARTER_LOOK[slot];
  };
  return {
    species: row && isAvatarSpecies(row.species) ? row.species : DEFAULT_SPECIES,
    scarf: worn('scarf', row?.scarf) as ScarfId | null,
    hat: worn('hat', row?.hat) as HatId | null,
    gear: worn('gear', row?.gear) as GearId | null,
    ownedItems,
  };
}

async function loadOwnedItems(database: Reader, userId: string): Promise<ItemId[]> {
  const rows = await database
    .select({ itemId: playerItems.itemId })
    .from(playerItems)
    .where(eq(playerItems.userId, userId));
  return rows.map(({ itemId }) => itemId).filter(isItemId);
}

// Puts the player in another animal's look, and records it.
export async function wearAvatar(userId: string, species: AvatarSpecies): Promise<AvatarSpecies> {
  await getDb().transaction(async (transaction) => {
    await transaction
      .insert(playerAvatars)
      .values({ userId, species })
      .onConflictDoUpdate({
        target: playerAvatars.userId,
        set: { species, updatedAt: new Date() },
      });
    await recordEvent(transaction, userId, 'avatar.changed', { species });
  });
  return species;
}

type Writer = Pick<ReturnType<typeof getDb>, 'insert'>;

async function putOn(transaction: Writer, userId: string, slot: ItemSlot, item: ItemId | null) {
  await transaction
    .insert(playerAvatars)
    .values({ userId, [slot]: item })
    .onConflictDoUpdate({
      target: playerAvatars.userId,
      set: { [slot]: item, updatedAt: new Date() },
    });
  await recordEvent(transaction, userId, 'item.worn', { itemId: item, slot });
}

// Puts on an item the player has in its slot, or leaves the slot empty, at the fitting room or the
// wardrobe. Returns false for an item they don't have. The request was checked for its slot.
export async function wearItem(
  userId: string,
  slot: ItemSlot,
  item: ItemId | null,
): Promise<boolean> {
  return getDb().transaction(async (transaction) => {
    if (item !== null && !ownsItem(await loadOwnedItems(transaction, userId), item)) {
      return false;
    }
    await putOn(transaction, userId, slot, item);
    return true;
  });
}

// Buys an item at the boutique and puts it on, in one transaction: paid, kept and worn, or none of
// it.
export async function buyItem(
  userId: string,
  item: ItemId,
): Promise<{ wallet: Wallet; look: Look; line: BoutiqueLine }> {
  return getDb().transaction(async (transaction) => {
    await loadWallet(transaction, userId);
    const result = async (line: BoutiqueLine) => ({
      wallet: await loadWallet(transaction, userId),
      look: await loadLook(transaction, userId),
      line,
    });
    const { price, slot } = ITEMS[item];
    if (isStarterItem(item)) {
      return result('notForSale');
    }

    const [added] = await transaction
      .insert(playerItems)
      .values({ userId, itemId: item })
      .onConflictDoNothing()
      .returning({ itemId: playerItems.itemId });
    if (!added) {
      return result('alreadyOwned');
    }

    const [paid] = await transaction
      .update(playerWallets)
      .set({ coins: sql`${playerWallets.coins} - ${price}`, updatedAt: new Date() })
      .where(and(eq(playerWallets.userId, userId), gte(playerWallets.coins, price)))
      .returning({ coins: playerWallets.coins });
    if (!paid) {
      await transaction
        .delete(playerItems)
        .where(and(eq(playerItems.userId, userId), eq(playerItems.itemId, item)));
      return result('notEnoughCoins');
    }

    await recordEvent(transaction, userId, 'item.bought', {
      itemId: item,
      slot,
      coins: price,
      coinsAfter: await coinsNow(transaction, userId),
    });
    await putOn(transaction, userId, slot, item);
    return result('thanks');
  });
}
