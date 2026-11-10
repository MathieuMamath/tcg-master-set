import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { openOwnedBoosters } from '@/player/shop';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/shop', () => ({ openOwnedBoosters: vi.fn() }));

function open(locale: string, set = 'swsh3', count?: string) {
  const lot = count === undefined ? '' : `&count=${count}`;
  return POST(
    new Request(`http://test.invalid/api/boosters/open?locale=${locale}&set=${set}${lot}`, {
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
    packs: [{ cards: [], isGodPack: true }],
    wallet: { coins: 900, boosters: {} },
  };
  vi.mocked(openOwnedBoosters).mockResolvedValue(opened);

  const response = await open('fr', '30th');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(opened);
  expect(openOwnedBoosters).toHaveBeenCalledWith('player-1', '30th', 'fr', 1);
});

test('opens a lot of five or ten boosters', async () => {
  vi.mocked(openOwnedBoosters).mockResolvedValue({
    setName: 'Placeholder',
    logoUrl: null,
    packs: [],
    wallet: { coins: 900, boosters: {} },
  });

  expect((await open('en', '30th', '10')).status).toBe(200);
  expect(openOwnedBoosters).toHaveBeenCalledWith('player-1', '30th', 'en', 10);
});

test('refuses a lot of any other size', async () => {
  for (const count of ['0', '3', '11', 'many']) {
    expect((await open('en', '30th', count)).status).toBe(400);
  }
});

test('refuses to open a booster the player does not have', async () => {
  vi.mocked(openOwnedBoosters).mockResolvedValue(null);

  expect((await open('en')).status).toBe(409);
});

test("refuses to open a booster before its set's binder is bought", async () => {
  vi.mocked(openOwnedBoosters).mockResolvedValue('needsBinder');

  const response = await open('en');

  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ error: 'needs-binder' });
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
  vi.mocked(openOwnedBoosters).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await open('en');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
