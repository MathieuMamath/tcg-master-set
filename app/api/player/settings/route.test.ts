import { beforeEach, expect, test, vi } from 'vitest';
import { getPlayer } from '@/auth/session';
import { saveSettings } from '@/player/settings';
import { PUT } from './route';

vi.mock('@/auth/session', () => ({ getPlayer: vi.fn() }));
vi.mock('@/player/settings', () => ({ saveSettings: vi.fn() }));

function put(body: unknown) {
  return PUT(
    new Request('http://localhost/api/player/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(saveSettings).mockReset();
  vi.mocked(getPlayer).mockResolvedValue({ id: 'player-1', username: 'Placeholder' });
});

test('saves a change and answers with every setting', async () => {
  vi.mocked(saveSettings).mockResolvedValue({ pullEffects: false });

  const response = await put({ pullEffects: false });

  expect(response.status).toBe(200);
  expect(saveSettings).toHaveBeenCalledWith('player-1', { pullEffects: false });
  expect(await response.json()).toEqual({ settings: { pullEffects: false } });
});

test('refuses a malformed change, and anyone signed out', async () => {
  expect((await put({ pullEffects: 'no' })).status).toBe(400);
  vi.mocked(getPlayer).mockResolvedValue(null);
  expect((await put({ pullEffects: false })).status).toBe(401);
  expect(saveSettings).not.toHaveBeenCalled();
});
