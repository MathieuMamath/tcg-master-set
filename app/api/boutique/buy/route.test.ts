import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { buyItem } from '@/player/avatar';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/avatar', () => ({ buyItem: vi.fn() }));

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/boutique/buy', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(buyItem).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('buys the item asked for, and answers with what the server decided', async () => {
  const answer = {
    wallet: { coins: 500, boosters: {} },
    look: {
      species: 'fox' as const,
      scarf: 'tartan' as const,
      hat: null,
      gear: 'satchel' as const,
      ownedItems: ['tartan' as const],
    },
    line: 'thanks' as const,
  };
  vi.mocked(buyItem).mockResolvedValue(answer);

  const response = await post({ item: 'tartan' });

  expect(response.status).toBe(200);
  expect(buyItem).toHaveBeenCalledWith('player-1', 'tartan');
  expect(await response.json()).toEqual(answer);
});

test('refuses an unknown item, and anyone signed out', async () => {
  expect((await post({ item: 'feather' })).status).toBe(400);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await post({ item: 'tartan' })).status).toBe(401);
  expect(buyItem).not.toHaveBeenCalled();
});

test('says so when the boutique could not sell', async () => {
  vi.mocked(buyItem).mockRejectedValue(new Error('down'));
  expect((await post({ item: 'polkaBow' })).status).toBe(503);
});
