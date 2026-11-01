import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { loadBoosterPool, loadOpenedCards } from '@/cards/booster-pool';
import { drawBooster } from '@/game/booster';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/cards/booster-pool', () => ({
  loadBoosterPool: vi.fn(),
  loadOpenedCards: vi.fn(),
}));
vi.mock('@/game/booster', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/game/booster')>()),
  drawBooster: vi.fn(),
}));

function open(locale: string, set = 'swsh3') {
  return POST(
    new Request(`http://test.invalid/api/boosters/open?locale=${locale}&set=${set}`, {
      method: 'POST',
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
  vi.mocked(loadBoosterPool).mockResolvedValue([]);
});

test('returns the drawn cards in the requested language', async () => {
  const drawn = [{ cardId: 'card-1', variant: 'normal' }];
  const opened = { setName: 'Placeholder', logoUrl: 'https://test.invalid/logo', cards: [] };
  vi.mocked(drawBooster).mockReturnValue(drawn);
  vi.mocked(loadOpenedCards).mockResolvedValue(opened);

  const response = await open('fr', '30th');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(opened);
  expect(loadOpenedCards).toHaveBeenCalledWith(drawn, '30th', 'fr');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await open('en')).status).toBe(401);
});

test('rejects an unknown language', async () => {
  expect((await open('xx')).status).toBe(400);
});

test('rejects a set the game does not play with', async () => {
  expect((await open('en', 'other')).status).toBe(400);
});

test('reports an empty catalogue as unavailable', async () => {
  vi.mocked(drawBooster).mockReturnValue(null);

  expect((await open('en')).status).toBe(503);
});

test('hides database errors from the player', async () => {
  vi.mocked(loadBoosterPool).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await open('en');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
