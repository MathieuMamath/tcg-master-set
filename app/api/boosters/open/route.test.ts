import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { openOwnedBooster } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ openOwnedBooster: vi.fn() }));

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
});

test('opens a booster of the signed-in player, in the requested language', async () => {
  const opened = {
    setName: 'Placeholder',
    logoUrl: 'https://test.invalid/logo',
    cards: [],
    isGodPack: true,
    wallet: { coins: 900, boosters: {} },
  };
  vi.mocked(openOwnedBooster).mockResolvedValue(opened);

  const response = await open('fr', '30th');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(opened);
  expect(openOwnedBooster).toHaveBeenCalledWith('player-1', '30th', 'fr');
});

test('refuses to open a booster the player does not have', async () => {
  vi.mocked(openOwnedBooster).mockResolvedValue(null);

  expect((await open('en')).status).toBe(409);
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

test('hides database errors from the player', async () => {
  vi.mocked(openOwnedBooster).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await open('en');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
