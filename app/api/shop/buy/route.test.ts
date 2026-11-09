import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { buyBooster } from '@/player/shop';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/shop', () => ({ buyBooster: vi.fn() }));

function buy(set: string, quantity?: string) {
  const query = quantity === undefined ? '' : `&quantity=${quantity}`;
  return POST(
    new Request(`http://test.invalid/api/shop/buy?set=${set}${query}`, { method: 'POST' }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(buyBooster).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('buys for the signed-in player and returns the new wallet', async () => {
  const result = { wallet: { coins: 900, boosters: { swsh3: 1 } }, line: 'thanks' as const };
  vi.mocked(buyBooster).mockResolvedValue(result);

  const response = await buy('swsh3');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(buyBooster).toHaveBeenCalledWith('player-1', 'swsh3', 1);
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await buy('swsh3')).status).toBe(401);
});

test('rejects a set the game does not play with', async () => {
  expect((await buy('other')).status).toBe(400);
});

test('hides database errors from the player', async () => {
  vi.mocked(buyBooster).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await buy('swsh3');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});

test('refuses a set the game does not play with', async () => {
  const response = await buy('other');

  expect(response.status).toBe(400);
  expect(buyBooster).not.toHaveBeenCalled();
});

test('buys several boosters at once', async () => {
  vi.mocked(buyBooster).mockResolvedValue({
    wallet: { coins: 700, boosters: { swsh3: 3 } },
    line: 'thanks',
  });

  expect((await buy('swsh3', '3')).status).toBe(200);
  expect(buyBooster).toHaveBeenCalledWith('player-1', 'swsh3', 3);
});

test('refuses a quantity out of range', async () => {
  expect((await buy('swsh3', '0')).status).toBe(400);
  expect((await buy('swsh3', '100')).status).toBe(400);
  expect((await buy('swsh3', '1e9')).status).toBe(400);
  expect(buyBooster).not.toHaveBeenCalled();
});
