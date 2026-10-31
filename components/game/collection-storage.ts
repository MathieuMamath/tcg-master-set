import { COLLECTION_STORAGE_KEY, type Collection, parseCollection } from '@/game/binder';

// Browser storage can throw, for example in a private window. The game works without it, but
// the collection then only lasts for the visit.
export function loadCollection(): Collection {
  try {
    return parseCollection(localStorage.getItem(COLLECTION_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function saveCollection(collection: Collection) {
  try {
    localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify(collection));
  } catch {
    // Nothing more to do: the collection stays in memory for this visit.
  }
}
