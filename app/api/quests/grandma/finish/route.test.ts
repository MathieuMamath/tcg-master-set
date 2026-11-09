import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { finishGrandmaQuest } from '@/player/quests/chores';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/quests/chores', () => ({ finishGrandmaQuest: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('finishes for the signed-in player', async () => {
  const result = { isRewarded: true, wallet: { coins: 100, boosters: {} } };
  vi.mocked(finishGrandmaQuest).mockResolvedValue(result);

  const response = await POST();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(finishGrandmaQuest).toHaveBeenCalledWith('player-1');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(finishGrandmaQuest).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await POST();

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
