import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { recordVisitEnd } from '@/player/progress';
import { POST } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/progress', () => ({ recordVisitEnd: vi.fn() }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(recordVisitEnd).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test("closes the player's visit", async () => {
  expect((await POST()).status).toBe(204);
  expect(recordVisitEnd).toHaveBeenCalledWith('player-1');
});

test('refuses a visitor who is not signed in', async () => {
  vi.mocked(getPlayer).mockResolvedValue(null);

  expect((await POST()).status).toBe(401);
  expect(recordVisitEnd).not.toHaveBeenCalled();
});
