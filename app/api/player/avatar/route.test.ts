import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { wearAvatar } from '@/player/avatar';
import { PUT } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/avatar', () => ({ wearAvatar: vi.fn() }));

function put(body: unknown) {
  return PUT(
    new Request('http://localhost/api/player/avatar', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(wearAvatar).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('puts the player in the animal asked for', async () => {
  vi.mocked(wearAvatar).mockResolvedValue('bear');

  const response = await put({ species: 'bear' });

  expect(response.status).toBe(200);
  expect(wearAvatar).toHaveBeenCalledWith('player-1', 'bear');
  expect(await response.json()).toEqual({ species: 'bear' });
});

test('refuses an unknown animal, and anyone signed out', async () => {
  expect((await put({ species: 'dragon' })).status).toBe(400);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await put({ species: 'bear' })).status).toBe(401);
  expect(wearAvatar).not.toHaveBeenCalled();
});

test('says so when the change could not be saved', async () => {
  vi.mocked(wearAvatar).mockRejectedValue(new Error('down'));
  const response = await put({ species: 'cat' });
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ error: 'avatar-unavailable' });
});
