import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { buyBinder } from '@/player/shop';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/shop', () => ({ buyBinder: vi.fn() }));

function buy(set: string) {
  return POST(new Request(`http://test.invalid/api/binders/buy?set=${set}`, { method: 'POST' }));
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(buyBinder).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('buys for the signed-in player and returns the result', async () => {
  const result = {
    wallet: { coins: 700, boosters: {} },
    binders: ['swsh3' as const],
    line: 'thanks' as const,
  };
  vi.mocked(buyBinder).mockResolvedValue(result);

  const response = await buy('swsh3');

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(buyBinder).toHaveBeenCalledWith('player-1', 'swsh3');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await buy('swsh3')).status).toBe(401);
});

test('refuses the binder of a set the game does not play with', async () => {
  expect((await buy('other')).status).toBe(400);
  expect(buyBinder).not.toHaveBeenCalled();
});

test('hides database errors from the player', async () => {
  vi.mocked(buyBinder).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await buy('swsh3');

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
