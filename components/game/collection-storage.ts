import { COLLECTION_STORAGE_KEY, type Collection, parseCollection } from '@/game/binder';

// One collection per player, since several accounts can share a browser.
function storageKey(playerId: string): string {
  return `${COLLECTION_STORAGE_KEY}:${playerId}`;
}

// Browser storage can throw, for example in a private window. The game works without it, but
// the collection then only lasts for the visit.
export function loadCollection(playerId: string): Collection {
  try {
    return parseCollection(localStorage.getItem(storageKey(playerId)));
  } catch {
    return {};
  }
}

export function saveCollection(playerId: string, collection: Collection) {
  try {
    localStorage.setItem(storageKey(playerId), JSON.stringify(collection));
  } catch {
    // Nothing more to do: the collection stays in memory for this visit.
  }
}
