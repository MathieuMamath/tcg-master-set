import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { claimDailyBonus } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ claimDailyBonus: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('claims the daily bonus of the signed-in player', async () => {
  const claim = {
    isClaimed: true,
    activity: { done: [], isBonusClaimed: true },
    wallet: { coins: 1600, boosters: {} },
  };
  vi.mocked(claimDailyBonus).mockResolvedValue(claim);

  const response = await POST();

  expect(await response.json()).toEqual(claim);
  expect(claimDailyBonus).toHaveBeenCalledWith('player-1');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
  expect(claimDailyBonus).not.toHaveBeenCalled();
});

test('hides database errors from the player', async () => {
  vi.mocked(claimDailyBonus).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await POST();

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
