import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { buyBooster } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ buyBooster: vi.fn() }));

function buy(set: string) {
  return POST(new Request(`http://test.invalid/api/shop/buy?set=${set}`, { method: 'POST' }));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('buys for the signed-in player and returns the new wallet', async () => {
  const result = { wallet: { coins: 900, boosters: { swsh3: 1 } }, line: 'thanks' as const };
  vi.mocked(buyBooster).mockResolvedValue(result);

  const response = await buy('swsh3');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(buyBooster).toHaveBeenCalledWith('player-1', 'swsh3');
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
