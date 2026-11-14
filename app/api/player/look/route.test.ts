import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { wearItem } from '@/player/avatar';
import { PUT } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/avatar', () => ({ wearItem: vi.fn() }));

function put(body: unknown) {
  return PUT(
    new Request('http://localhost/api/player/look', { method: 'PUT', body: JSON.stringify(body) }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(wearItem).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('puts on an item the player has, in its slot', async () => {
  vi.mocked(wearItem).mockResolvedValue(true);

  const response = await put({ slot: 'scarf', item: 'polkaBow' });

  expect(response.status).toBe(200);
  expect(wearItem).toHaveBeenCalledWith('player-1', 'scarf', 'polkaBow');
  expect(await response.json()).toEqual({ slot: 'scarf', item: 'polkaBow' });
});

test('refuses an item the player has not bought', async () => {
  vi.mocked(wearItem).mockResolvedValue(false);
  expect((await put({ slot: 'scarf', item: 'starryNight' })).status).toBe(403);
});

test('refuses an item in another slot, an unknown one, and anyone signed out', async () => {
  expect((await put({ slot: 'gear', item: 'tartan' })).status).toBe(400);
  expect((await put({ slot: 'scarf', item: 'feather' })).status).toBe(400);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await put({ slot: 'scarf', item: 'tartan' })).status).toBe(401);
  expect(wearItem).not.toHaveBeenCalled();
});
