import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { reelInItem } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ reelInItem: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('reels in an item for the signed-in player', async () => {
  const result = {
    item: 'treasure' as const,
    boosterSetId: 'me05' as const,
    wallet: { coins: 100, boosters: { me05: 1 } },
  };
  vi.mocked(reelInItem).mockResolvedValue(result);

  const response = await POST();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(reelInItem).toHaveBeenCalledWith('player-1');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(reelInItem).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await POST();

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
