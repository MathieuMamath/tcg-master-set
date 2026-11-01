import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { loadBinderCatalogue } from '@/cards/binder-catalogue';
import { GET } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/cards/binder-catalogue', () => ({ loadBinderCatalogue: vi.fn() }));

function load(locale: string, set = 'swsh3') {
  return GET(new Request(`http://test.invalid/api/binder?locale=${locale}&set=${set}`));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('returns the catalogue in the requested language', async () => {
  const catalogue = {
    setName: 'Placeholder',
    cards: [
      { id: 'a', localId: '1', name: 'A', rarity: null, imageUrl: null, variants: ['normal'] },
    ],
  };
  vi.mocked(loadBinderCatalogue).mockResolvedValue(catalogue);

  const response = await load('fr', '30th');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(catalogue);
  expect(loadBinderCatalogue).toHaveBeenCalledWith('30th', 'fr');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await load('en')).status).toBe(401);
});

test('rejects an unknown language', async () => {
  expect((await load('xx')).status).toBe(400);
});

test('rejects a set the game does not play with', async () => {
  expect((await load('en', 'other')).status).toBe(400);
});

test('reports an empty catalogue as unavailable', async () => {
  vi.mocked(loadBinderCatalogue).mockResolvedValue({ setName: '', cards: [] });

  expect((await load('en')).status).toBe(503);
});

test('hides database errors from the player', async () => {
  vi.mocked(loadBinderCatalogue).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await load('en');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
