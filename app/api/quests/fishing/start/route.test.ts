import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { startFishingQuest } from '@/player/quests/fishing';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/quests/fishing', () => ({ startFishingQuest: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('starts for the signed-in player', async () => {
  const result = { hasStarted: true };
  vi.mocked(startFishingQuest).mockResolvedValue(result);

  const response = await POST();

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(result);
  expect(startFishingQuest).toHaveBeenCalledWith('player-1');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
});

test('hides database errors from the player', async () => {
  vi.mocked(startFishingQuest).mockRejectedValue(new Error('connection to secret-host refused'));

  const response = await POST();

  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('secret-host');
});
